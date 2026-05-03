import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-designer`;

const GameChat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "👋 Salut ! Je suis ton **concepteur de jeu IA**. Décris-moi le jeu que tu imagines : genre, ambiance, plateforme, niveau de complexité, et — si tu veux — un jeu ou un joueur dont tu veux t'inspirer. Plus tu donnes de détails, plus je peux pousser le design loin (jusqu'à un GDD complet). ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== "" || (last?.role === "assistant" && acc.length > 0 && prev.length > 0 && prev[prev.length-1].role === "assistant")) {
          // already streaming
        }
        if (last?.role === "assistant" && (acc.length > chunk.length || acc === chunk)) {
          // continue updating last assistant
          return prev.map((m, i) => (i === prev.length - 1 && m.role === "assistant" ? { ...m, content: acc } : m));
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Trop de requêtes, réessaie dans un instant.");
        else if (resp.status === 402) toast.error("Crédits IA épuisés.");
        else toast.error("Erreur lors de la génération.");
        setLoading(false);
        return;
      }

      // start an empty assistant message
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
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m));
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

  return (
    <main className="flex min-h-screen flex-col px-4 py-6">
      <header className="mb-4 text-center">
        <h1 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
          🎮 AI Game Designer
        </h1>
        <p className="mt-1 text-xs text-accent sm:text-sm">
          Décris ton jeu de rêve. L'IA te livre un design adapté à ton niveau (de quelques minutes jusqu'à 3 jours pour un GDD pro).
        </p>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto rounded-lg bg-card p-4 sm:p-6"
        style={{ boxShadow: "var(--shadow-glow)", maxHeight: "calc(100vh - 220px)" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary/20 text-primary"
                  : "bg-background/40 text-accent"
              }`}
            >
              <div className="prose prose-sm prose-invert max-w-none break-words">
                <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

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
          placeholder="Décris ton jeu… (ex: un RPG sombre style Dark Souls, niveau pro)"
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
