import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PersonalInfo from "@/components/PersonalInfo";
import { useInView } from "@/hooks/useInView";
import { useAuth } from "@/hooks/useAuth";

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
  const welcome = WELCOME;
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <div className="mb-6 flex justify-end">
        {user ? (
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>

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
          <p className="text-center text-2xl font-semibold leading-relaxed text-accent sm:text-3xl md:text-4xl">
            {welcome}
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-2xl">
        <PersonalInfo />
      </AnimatedSection>
    </main>
  );
};

export default Index;
