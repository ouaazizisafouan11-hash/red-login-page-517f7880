import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { LogOut, Library, Sparkles, Loader2, Mic, MicOff, Phone, PhoneOff, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };
type SpeechRecognitionErrorEventLike = { error: string };
type SpeechRecognitionResultLike = { isFinal?: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

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

const SPEECH_LANGUAGES = [
  { code: "ar-SA", label: "العربية" },
  { code: "fr-FR", label: "Français" },
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Español" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
] as const;

const SPEECH_LANGUAGE_CODES: readonly string[] = SPEECH_LANGUAGES.map((l) => l.code);

const normalizeArabicSpeech = (text: string) =>
  text
    .replace(/activis|factivis|اكتيفيس|فاكتيفيس/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
};

const safeStopRecognition = (recognition: BrowserSpeechRecognition | null) => {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (error) {
    console.debug("speech stop ignored", error);
  }
};

const getInitialSpeechLang = () => {
  const saved = localStorage.getItem("speech_language");
  if (saved && SPEECH_LANGUAGE_CODES.includes(saved)) return saved;
  return "ar-SA";
};

const langDir = (lang: string) => (lang.startsWith("ar") ? "rtl" : "ltr");

// Strip the marker lines from displayed content
const cleanForDisplay = (s: string) =>
  s
    .replace(/^ESTIMATION:\s*\d+\s*min\s*-\s*.*$/im, "")
    .replace(/READY_TO_GENERATE\s*$/i, "")
    .trim();

// Strip markdown, emojis, code blocks etc. so TTS reads naturally.
// Also shorten to keep the spoken reply digestible.
const cleanForSpeech = (s: string, maxChars = 350) => {
  const original = cleanForDisplay(s);
  let t = original
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-–—•]\s*/gm, "")
    .replace(/\*([^*\n]{1,120})\*/g, " ")
    .replace(/[*_~>#]+/g, " ")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  // Safety net: if our cleaning ate everything, fall back to the raw display text
  if (!t) t = original.replace(/\s+/g, " ").trim();
  if (t.length > maxChars) {
    const slice = t.slice(0, maxChars);
    const lastDot = Math.max(
      slice.lastIndexOf("."),
      slice.lastIndexOf("!"),
      slice.lastIndexOf("?"),
      slice.lastIndexOf("،"),
    );
    t = (lastDot > 80 ? slice.slice(0, lastDot + 1) : slice).trim();
  }
  return t;
};

// Pick best TTS lang based on what the AI actually wrote, so we don't read
// Arabic with a French voice (or vice-versa).
const detectLangCode = (text: string, fallback: string): string => {
  const sample = text.slice(0, 400);
  if (/[\u0600-\u06FF]/.test(sample)) return "ar-SA";
  if (/[\u4E00-\u9FFF]/.test(sample)) return "zh-CN";
  if (/[\u3040-\u30FF]/.test(sample)) return "ja-JP";
  if (/[\uAC00-\uD7AF]/.test(sample)) return "ko-KR";
  if (/[\u0400-\u04FF]/.test(sample)) return "ru-RU";
  // Latin scripts: keep the user's selected language
  return fallback;
};


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
  const [listening, setListening] = useState(false);
  const [voiceChat, setVoiceChat] = useState(false);
  const [speechLang, setSpeechLang] = useState(getInitialSpeechLang);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceChatRef = useRef(false);
  const voiceRecRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechLangRef = useRef(speechLang);
  const voiceProcessingRef = useRef(false);
  const voiceSilenceTimerRef = useRef<number | null>(null);
  const voiceTranscriptRef = useRef("");
  const voiceStartedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    speechLangRef.current = speechLang;
    localStorage.setItem("speech_language", speechLang);
  }, [speechLang]);

  // Stop ALL voice activity when leaving the page (unmount or tab close)
  useEffect(() => {
    const stopEverything = () => {
      voiceChatRef.current = false;
      voiceProcessingRef.current = false;
      voiceTranscriptRef.current = "";
      if (voiceSilenceTimerRef.current) {
        window.clearTimeout(voiceSilenceTimerRef.current);
        voiceSilenceTimerRef.current = null;
      }
      safeStopRecognition(recognitionRef.current);
      safeStopRecognition(voiceRecRef.current);
      recognitionRef.current = null;
      voiceRecRef.current = null;
      try { window.speechSynthesis?.cancel(); } catch {}
    };
    window.addEventListener("beforeunload", stopEverything);
    window.addEventListener("pagehide", stopEverything);
    return () => {
      window.removeEventListener("beforeunload", stopEverything);
      window.removeEventListener("pagehide", stopEverything);
      stopEverything();
    };
  }, []);

  const toggleMic = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Reconnaissance vocale non supportée. Utilise Chrome ou Edge.");
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const rec = new SR();
    rec.lang = speechLangRef.current;
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (e: any) => {
      console.error("speech error", e);
      setListening(false);
      if (e.error === "not-allowed") toast.error("Microphone refusé.");
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
    toast.info(`🎤 Parle maintenant en ${SPEECH_LANGUAGES.find((l) => l.code === speechLangRef.current)?.label ?? speechLangRef.current}.`);
  };

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

  const send = async (overrideText?: string, mode?: "voice"): Promise<string> => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return "";
    if (!overrideText) setInput("");
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
          mode,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Trop de requêtes, réessaie dans un instant.");
        else if (resp.status === 402) toast.error("Crédits IA épuisés.");
        else toast.error("Erreur lors de la génération.");
        setLoading(false);
        return "";
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
    return acc;
  };

  const speak = (text: string, lang: string) => {
    if (!("speechSynthesis" in window)) return;
    const spokenText = cleanForSpeech(text, 320);
    if (!spokenText) {
      voiceProcessingRef.current = false;
      if (voiceChatRef.current) startVoiceListen();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spokenText.slice(0, 1200));
    u.lang = lang;
    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (matchingVoice) u.voice = matchingVoice;
    u.rate = 1;
    u.onend = () => {
      voiceProcessingRef.current = false;
      if (voiceChatRef.current) startVoiceListen();
    };
    window.speechSynthesis.speak(u);
  };

  const startVoiceListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (voiceRecRef.current) {
      try { voiceRecRef.current.stop(); } catch {}
    }
    if (voiceSilenceTimerRef.current) window.clearTimeout(voiceSilenceTimerRef.current);
    voiceTranscriptRef.current = "";
    voiceStartedRef.current = false;
    const rec = new SR();
    rec.lang = speechLangRef.current;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    const submitTranscript = async () => {
      const transcript = normalizeArabicSpeech(voiceTranscriptRef.current);
      voiceTranscriptRef.current = "";
      if (!transcript || voiceProcessingRef.current || !voiceChatRef.current) return;
      const lang = speechLangRef.current;
      voiceProcessingRef.current = true;
      try { rec.stop(); } catch {}
      const reply = await send(transcript, "voice");
      if (voiceChatRef.current && reply) {
        speak(reply, lang);
      } else {
        voiceProcessingRef.current = false;
        if (voiceChatRef.current) setTimeout(() => voiceChatRef.current && startVoiceListen(), 300);
      }
    };
    rec.onstart = () => {
      voiceStartedRef.current = true;
    };
    rec.onresult = (e: any) => {
      let combined = "";
      for (let i = 0; i < e.results.length; i++) {
        combined += `${e.results[i][0].transcript} `;
      }
      const transcript = normalizeArabicSpeech(combined);
      if (!transcript) return;
      voiceTranscriptRef.current = transcript;
      setInput(transcript);
      if (voiceSilenceTimerRef.current) window.clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = window.setTimeout(submitTranscript, 1400);
    };
    rec.onerror = (e: any) => {
      console.error("voice chat err", e);
      voiceProcessingRef.current = false;
      if (voiceChatRef.current && e.error !== "not-allowed") setTimeout(() => voiceChatRef.current && startVoiceListen(), 800);
      if (e.error === "not-allowed") toast.error("Microphone refusé. Autorise le micro dans le navigateur.");
      if (e.error === "no-speech") toast.info("لم أسمع الجملة كاملة، قرّب الميكروفون وتحدث بوضوح.");
    };
    rec.onend = () => {
      // restart if still in voice mode and not currently speaking/loading
      if (voiceChatRef.current && !voiceProcessingRef.current && !window.speechSynthesis?.speaking) {
        const transcript = normalizeArabicSpeech(voiceTranscriptRef.current);
        if (transcript) void submitTranscript();
        else setTimeout(() => voiceChatRef.current && startVoiceListen(), voiceStartedRef.current ? 300 : 800);
      }
    };
    try {
      rec.start();
      voiceRecRef.current = rec;
    } catch {}
  };

  const toggleVoiceChat = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Conversation vocale non supportée. Utilise Chrome ou Edge.");
      return;
    }
    if (voiceChat) {
      voiceChatRef.current = false;
      voiceProcessingRef.current = false;
      voiceTranscriptRef.current = "";
      if (voiceSilenceTimerRef.current) window.clearTimeout(voiceSilenceTimerRef.current);
      setVoiceChat(false);
      try { voiceRecRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
      toast.info("📞 Appel terminé.");
      return;
    }
    voiceChatRef.current = true;
    voiceProcessingRef.current = false;
    voiceTranscriptRef.current = "";
    if (voiceSilenceTimerRef.current) window.clearTimeout(voiceSilenceTimerRef.current);
    setVoiceChat(true);
    toast.success(`📞 Mode conversation activé — parle en ${SPEECH_LANGUAGES.find((l) => l.code === speechLangRef.current)?.label ?? speechLangRef.current}.`);
    startVoiceListen();
  };

  const changeSpeechLang = (lang: string) => {
    setSpeechLang(lang);
    try { recognitionRef.current?.stop(); } catch {}
    try { voiceRecRef.current?.stop(); } catch {}
    if (voiceChatRef.current) {
      voiceProcessingRef.current = false;
      voiceTranscriptRef.current = "";
      if (voiceSilenceTimerRef.current) window.clearTimeout(voiceSilenceTimerRef.current);
      window.speechSynthesis?.cancel();
      setTimeout(() => startVoiceListen(), 250);
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
      navigate(`/games`);
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
        <div className="flex flex-1 flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Languages className="h-4 w-4" />
            <select
              value={speechLang}
              onChange={(e) => changeSpeechLang(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              aria-label="Voice language"
            >
              {SPEECH_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            dir={langDir(speechLang)}
            placeholder={listening ? "🎤 تكلّم الآن…" : "اكتب أو تكلّم عن لعبتك… 🎤"}
            className="min-h-[60px] resize-none"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={toggleMic}
            disabled={loading}
            variant={listening ? "default" : "outline"}
            size="icon"
            className={listening ? "animate-pulse" : ""}
            title={listening ? "Arrêter le micro" : "Parler (toutes langues)"}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={toggleVoiceChat}
            disabled={loading}
            variant={voiceChat ? "default" : "outline"}
            size="icon"
            className={voiceChat ? "animate-pulse" : ""}
            title={voiceChat ? "Terminer l'appel" : "Conversation vocale (mode appel)"}
          >
            {voiceChat ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </Button>
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
            {loading ? "…" : "→"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default GameChat;
