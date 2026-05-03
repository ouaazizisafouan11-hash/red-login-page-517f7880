import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";

const WELCOME =
  "I'm honored to meet you. My name is Adnane ouaazizi, and this is my first web project. I hope you enjoy it.";

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
      className={`${className} ${inView ? "animate-soft-reveal opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
};

const Index = () => {
  const text = "I'm the best in coding";

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-3xl md:text-4xl">
          Adnane The King
        </h2>
        <Button asChild className="h-10 px-5 text-sm sm:h-11 sm:px-6 sm:text-base">
          <Link to="/chat">Entrer 🎮</Link>
        </Button>
      </div>

      <AnimatedSection className="flex min-h-[40vh] items-center justify-center">
        <h1
          className="text-center text-2xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl"
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
          <p className="text-center text-2xl font-semibold leading-relaxed text-accent sm:text-3xl md:text-4xl">
            {WELCOME}
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <Link
          to="/chat"
          className="inline-block rounded-lg bg-primary px-8 py-4 text-lg font-bold text-primary-foreground hover:bg-primary/80"
        >
          🎮 Parler à l'IA conceptrice de jeux
        </Link>
        <p className="mt-3 text-sm text-accent">
          Aucun email, aucune inscription. Entre directement et décris le jeu de tes rêves.
        </p>
      </AnimatedSection>
    </main>
  );
};

export default Index;
