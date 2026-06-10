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
  const text = "Adnane Ouaazizi";

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">

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

      <AnimatedSection className="mx-auto max-w-3xl">
        <div
          className="relative rounded-lg bg-card p-6 sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <h2 className="mb-6 text-center text-xl font-bold text-primary sm:text-2xl">
            My Personal Information
          </h2>
          <ul className="space-y-3 text-lg text-foreground">
            <li className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span><strong>First Name:</strong> Adnane</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span><strong>Last Name:</strong> Ouaazizi</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span><strong>City/Country:</strong> Morocco</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span><strong>Email:</strong> ouaazizisafouan11@gmail.com</span>
            </li>
          </ul>
        </div>
      </AnimatedSection>
    </main>
  );
};

export default Index;
