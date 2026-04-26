import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import PersonalInfo from "@/components/PersonalInfo";
import { useInView } from "@/hooks/useInView";

const DEFAULT_WELCOME =
  "I'm honored to meet you. My name is Adnane Aziz, and this is my very first web project. I hope you enjoy it.";
const STORAGE_KEY = "welcome_message";

const AnimatedSection = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} ${inView ? "animate-jump-spin opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
};

const Index = () => {
  const text = "I'm the best in coding";

  const [welcome, setWelcome] = useState<string>(DEFAULT_WELCOME);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(DEFAULT_WELCOME);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setWelcome(saved);
      setDraft(saved);
    }
  }, []);

  const startEdit = () => {
    setDraft(welcome);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(welcome);
    setEditing(false);
  };

  const saveEdit = () => {
    const value = draft.trim() || DEFAULT_WELCOME;
    setWelcome(value);
    localStorage.setItem(STORAGE_KEY, value);
    setEditing(false);
  };

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <AnimatedSection className="flex min-h-[60vh] items-center justify-center">
        <h1
          className="text-center text-4xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl"
          aria-label={text}
        >
          {text.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block animate-fade-in"
              style={{
                animationDelay: `${i * 80}ms`,
                animationFillMode: "both",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
      </AnimatedSection>

      <AnimatedSection className="mx-auto mb-10 max-w-3xl">
        <div
          className="relative rounded-lg bg-card p-6 sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div className="mb-4 flex justify-end">
            {!editing ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/80"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-accent hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" /> Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/80"
                >
                  <Save className="h-3.5 w-3.5" /> Enregistrer
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <p className="text-center text-2xl font-semibold leading-relaxed text-accent sm:text-3xl md:text-4xl">
              {welcome}
            </p>
          ) : (
            <textarea
              autoFocus
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md bg-input px-4 py-3 text-center text-2xl font-semibold leading-relaxed text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-ring sm:text-3xl"
            />
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-2xl">
        <PersonalInfo />
      </AnimatedSection>
    </main>
  );
};

export default Index;
