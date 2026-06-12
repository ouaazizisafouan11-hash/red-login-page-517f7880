import { AnimatedSection, GoldDivider, GoldNav } from "@/components/GoldUI";

const WELCOME =
  "I'm honored to meet you. My name is Adnane ouaazizi, and this is my first web project. I hope you enjoy it.";

const Index = () => {
  const text = "Adnane Ouaazizi";

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <GoldNav />

      <AnimatedSection className="flex min-h-[40vh] flex-col items-center justify-center">
        <p className="font-script mb-2 text-3xl text-accent/90 sm:text-4xl">Welcome</p>
        <h1
          className="text-glow font-display text-center text-3xl font-bold tracking-wide text-gold-gradient sm:text-5xl md:text-6xl"
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
        <GoldDivider ornament="❧" />
      </AnimatedSection>

      <AnimatedSection className="mx-auto mb-10 max-w-3xl">
        <div
          className="relative rounded-lg border border-border/60 bg-card/80 p-6 backdrop-blur-sm sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <p className="font-serif-elegant text-glow text-center text-2xl font-medium italic leading-relaxed text-accent sm:text-3xl md:text-4xl">
            {WELCOME}
          </p>
        </div>
      </AnimatedSection>
    </main>
  );
};

export default Index;
