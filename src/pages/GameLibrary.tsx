import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft, Play, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Game = {
  id: string;
  title: string;
  status: string;
  estimated_minutes: number | null;
  created_at: string;
  completed_at: string | null;
};

const formatDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)} min`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)} h`;
  const d = h / 24;
  if (d < 7) return `${Math.round(d)} j`;
  if (d < 30) return `${Math.round(d / 7)} sem`;
  return `${Math.round(d / 30)} mois`;
};

const SESSION_KEY = "game_session_id";
const getSessionId = () => {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
};

const GameLibrary = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sessionId = getSessionId();
    const load = async () => {
      const { data } = await supabase
        .from("games")
        .select("id,title,status,estimated_minutes,created_at,completed_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });
      if (data) setGames(data as Game[]);
    };
    load();

    const channel = supabase
      .channel("games-library")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `session_id=eq.${sessionId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Notify on ready with actual duration
  useEffect(() => {
    games.forEach((g) => {
      if (g.status === "ready" && !notified.has(g.id)) {
        const duration =
          g.completed_at && g.created_at
            ? new Date(g.completed_at).getTime() - new Date(g.created_at).getTime()
            : null;
        const durTxt = duration ? ` (en ${formatDuration(duration)})` : "";
        toast.success(`🎉 "${g.title}" est prêt à jouer !${durTxt}`, {
          description: "Clique sur Play pour lancer le jeu.",
          duration: 8000,
        });
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🎮 Jeu prêt !", {
            body: `"${g.title}" est prêt${durTxt}. Clique sur Play pour jouer.`,
          });
        }
        setNotified((s) => new Set(s).add(g.id));
      }
    });
  }, [games, notified]);

  // Ask permission for browser notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/chat")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Retour au chat
        </Button>
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl">
          🎮 Mes jeux
        </h1>
        <div className="w-[120px]" />
      </header>

      {games.length === 0 ? (
        <div className="rounded-lg bg-card p-8 text-center text-accent">
          Aucun jeu encore. Va dans le chat et fais-en générer un !
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{g.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {g.status === "ready" && (
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Prêt
                      {g.completed_at && g.created_at && (
                        <span className="text-accent">
                          · généré en {formatDuration(new Date(g.completed_at).getTime() - new Date(g.created_at).getTime())}
                        </span>
                      )}
                    </span>
                  )}
                  {g.status === "generating" && (
                    <span className="flex items-center gap-1 text-accent">
                      <Loader2 className="h-3 w-3 animate-spin" /> En cours…
                      {g.estimated_minutes != null && ` ~${formatMinutes(g.estimated_minutes)}`}
                    </span>
                  )}
                  {g.status === "pending" && (
                    <span className="flex items-center gap-1 text-accent">
                      <Loader2 className="h-3 w-3 animate-spin" /> En attente…
                    </span>
                  )}
                  {g.status === "failed" && (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3 w-3" /> Échec
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/play/${g.id}`)}
                disabled={g.status !== "ready" && g.status !== "failed"}
                className="gap-1.5"
              >
                <Play className="h-4 w-4" />
                {g.status === "ready" ? "Play" : "Voir"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

function formatMinutes(m: number) {
  if (m < 60) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}j`;
}

export default GameLibrary;
