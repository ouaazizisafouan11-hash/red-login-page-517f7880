import { AnimatedSection, GoldDivider, GoldNav } from "@/components/GoldUI";

const About = () => {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <GoldNav />

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

export default About;
