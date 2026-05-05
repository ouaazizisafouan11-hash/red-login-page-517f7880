import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

type Game = {
  id: string;
  title: string;
  status: string;
  html_code: string | null;
  error_message: string | null;
  estimated_minutes: number | null;
  created_at: string;
  completed_at: string | null;
};

const GamePlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
      if (data) setGame(data as Game);
    };
    load();
    const channel = supabase
      .channel(`game-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${id}` },
        (payload) => setGame(payload.new as Game),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center text-foreground">
        Chargement…
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/games")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Mes jeux
        </Button>
        <h1 className="truncate bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-base font-bold text-transparent sm:text-xl">
          🎮 {game.title}
        </h1>
        <div className="w-[100px]" />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6">
        {game.status === "ready" && game.html_code ? (
          <iframe
            title={game.title}
            srcDoc={game.html_code}
            sandbox="allow-scripts allow-same-origin"
            className="h-[calc(100vh-120px)] w-full rounded-lg border border-border bg-black"
          />
        ) : game.status === "failed" ? (
          <div className="rounded-lg bg-card p-6 text-center">
            <p className="font-semibold text-primary">Échec de la génération</p>
            <p className="mt-2 text-sm text-accent">{game.error_message}</p>
          </div>
        ) : (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-lg bg-card text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-foreground">L'IA crée ton jeu…</p>
            {game.estimated_minutes != null && (
              <p className="text-sm text-accent">Temps estimé : ~{formatMinutes(game.estimated_minutes)}</p>
            )}
            <p className="max-w-md text-xs text-muted-foreground">
              Tu peux fermer cette page. Le jeu apparaîtra dans "Mes jeux" une fois prêt.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} j`;
}

export default GamePlay;
