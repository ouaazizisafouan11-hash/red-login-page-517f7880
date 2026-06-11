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

const GoldDivider = ({ ornament = "✦" }: { ornament?: string }) => (
  <div className="gold-divider my-6 text-lg">
    <span className="font-script text-2xl text-accent">{ornament}</span>
  </div>
);

const Index = () => {
  const text = "Adnane Ouaazizi";

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">

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

      <AnimatedSection className="mx-auto max-w-3xl">
        <div
          className="relative rounded-lg border border-border/60 bg-card/80 p-6 backdrop-blur-sm sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <h2 className="text-glow font-display mb-2 text-center text-2xl font-bold tracking-wide text-gold-gradient sm:text-3xl">
            My Personal Information
          </h2>
          <GoldDivider ornament="✦" />
          <ul className="space-y-4 font-serif-elegant text-xl text-foreground sm:text-2xl">
            <li className="flex items-center gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <span><strong className="font-display text-lg tracking-wide text-primary">First Name:</strong> Adnane</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <span><strong className="font-display text-lg tracking-wide text-primary">Last Name:</strong> Ouaazizi</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <span><strong className="font-display text-lg tracking-wide text-primary">City/Country:</strong> Morocco</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <span><strong className="font-display text-lg tracking-wide text-primary">Email:</strong> ouaazizisafouan11@gmail.com</span>
            </li>
          </ul>
        </div>
      </AnimatedSection>
    </main>
  );
};

export default Index;
