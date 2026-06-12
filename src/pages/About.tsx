import { AnimatedSection, GoldCorners, GoldDivider, GoldNav } from "@/components/GoldUI";

const INFO = [
  { label: "First Name:", value: "Adnane" },
  { label: "Last Name:", value: "Ouaazizi" },
  { label: "City/Country:", value: "Morocco" },
  { label: "Email:", value: "ouaazizisafouan11@gmail.com" },
];

const About = () => {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <GoldNav />

      <AnimatedSection className="mx-auto max-w-3xl">
        <div
          className="relative rounded-lg border border-border/60 bg-card/80 p-6 backdrop-blur-sm sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <GoldCorners />
          <h2 className="text-glow font-display mb-2 text-center text-2xl font-bold tracking-wide text-gold-gradient sm:text-3xl">
            My Personal Information
          </h2>
          <GoldDivider ornament="✦" />
          <ul className="space-y-4 font-serif-elegant text-xl text-foreground sm:text-2xl">
            {INFO.map((item, i) => (
              <li
                key={item.label}
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${250 + i * 150}ms`, animationFillMode: "both" }}
              >
                <span className="font-script text-2xl text-accent">✧</span>
                <span>
                  <strong className="font-display text-lg tracking-wide text-primary">{item.label}</strong>{" "}
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>
    </main>
  );
};

export default About;
