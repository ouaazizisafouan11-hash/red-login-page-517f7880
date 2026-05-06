import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { LogOut, Library, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-designer`;

const SESSION_KEY = "game_session_id";
const getSessionId = () => {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
};

// Strip the marker lines from displayed content
const cleanForDisplay = (s: string) =>
  s
    .replace(/^ESTIMATION:\s*\d+\s*min\s*-\s*.*$/im, "")
    .replace(/READY_TO_GENERATE\s*$/i, "")
    .trim();

const parseEstimation = (s: string): { minutes: number; label: string } | null => {
  const m = s.match(/ESTIMATION:\s*(\d+)\s*min\s*-\s*(.+)/i);
  if (!m) return null;
  return { minutes: parseInt(m[1], 10), label: m[2].trim() };
};

const isReady = (s: string) => /READY_TO_GENERATE/i.test(s);

const formatMinutes = (m: number) => {
  if (m < 60) return `${m} min`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)} h`;
  const d = h / 24;
  if (d < 7) return `${Math.round(d)} jour${d >= 1.5 ? "s" : ""}`;
  if (d < 30) return `${Math.round(d / 7)} semaine${d >= 10.5 ? "s" : ""}`;
  return `${Math.round(d / 30)} mois`;
};

const GameChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "👋 Salut ! Je suis ton **concepteur de jeu IA**. Décris-moi le jeu que tu imagines : genre, ambiance, plateforme, niveau de complexité, et — si tu veux — un jeu ou un joueur dont tu veux t'inspirer. Quand le concept sera clair, je te donnerai une estimation de temps et un bouton pour **générer** un jeu HTML5 jouable. ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Find latest assistant message that has READY + ESTIMATION
  const lastReady = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "assistant") continue;
      if (isReady(m.content)) {
        const est = parseEstimation(m.content);
        return { content: m.content, est };
      }
    }
    return null;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);

    let acc = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Trop de requêtes, réessaie dans un instant.");
        else if (resp.status === 402) toast.error("Crédits IA épuisés.");
        else toast.error("Erreur lors de la génération.");
        setLoading(false);
        return;
      }

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m)),
              );
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connexion interrompue.");
    } finally {
      setLoading(false);
    }
  };

  const generateGame = async () => {
    if (!lastReady || generating) return;
    setGenerating(true);
    try {
      const est = lastReady.est;
      // Title from first user message (or fallback)
      const firstUser = messages.find((m) => m.role === "user")?.content || "Mon jeu";
      const title = firstUser.length > 60 ? firstUser.slice(0, 60) + "…" : firstUser;
      // Full prompt = full design from last assistant ready msg
      const prompt = cleanForDisplay(lastReady.content);

      const sessionId = getSessionId();
      const { data: inserted, error: insErr } = await supabase
        .from("games")
        .insert({
          session_id: sessionId,
          title,
          prompt,
          status: "pending",
          estimated_minutes: est?.minutes ?? null,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw insErr || new Error("insert failed");

      const { error: fnErr } = await supabase.functions.invoke("game-generator", {
        body: { gameId: inserted.id },
      });
      if (fnErr) throw fnErr;

      toast.success("Génération lancée ! Tu peux suivre dans 'Mes jeux'.");
      navigate(`/play/${inserted.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de lancer la génération.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col px-4 py-6">
      <header className="mx-auto mb-4 flex w-full max-w-3xl items-center justify-between gap-2">
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-lg font-extrabold tracking-tight text-transparent sm:text-xl">
          🎮 AI Game Designer
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/games")} className="gap-1.5">
            <Library className="h-4 w-4" />
            Mes jeux
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Quitter
          </Button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto rounded-lg bg-card p-4 sm:p-6"
        style={{ boxShadow: "var(--shadow-glow)", maxHeight: "calc(100vh - 260px)" }}
      >
        {messages.map((m, i) => {
          const display = m.role === "assistant" ? cleanForDisplay(m.content) : m.content;
          const est = m.role === "assistant" ? parseEstimation(m.content) : null;
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary/20 text-primary" : "bg-background/40 text-accent"
                }`}
              >
                {est && (
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    ⏱️ Temps estimé : {formatMinutes(est.minutes)} — {est.label}
                  </div>
                )}
                <div className="prose prose-sm prose-invert max-w-none break-words">
                  <ReactMarkdown>
                    {display || (loading && i === messages.length - 1 ? "…" : "")}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lastReady && (
        <div className="mx-auto mt-3 w-full max-w-3xl">
          <Button
            onClick={generateGame}
            disabled={generating}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Lancement…" : "🎮 Générer le jeu maintenant"}
          </Button>
        </div>
      )}

      <div className="mx-auto mt-4 flex w-full max-w-3xl gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Décris ton jeu… (ex: un platformer 2D rétro avec un chat ninja)"
          className="min-h-[60px] resize-none"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="h-auto px-6">
          {loading ? "…" : "Envoyer"}
        </Button>
      </div>
    </main>
  );
};

export default GameChat;
