import { AnimatedSection, GoldDivider, GoldNav } from "@/components/GoldUI";

const Dreams = () => {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <GoldNav />

      <AnimatedSection className="mx-auto max-w-3xl">
        <div
          className="relative rounded-lg border border-border/60 bg-card/80 p-6 backdrop-blur-sm sm:p-8"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <h2 className="text-glow font-display mb-2 text-center text-2xl font-bold tracking-wide text-gold-gradient sm:text-3xl">
            My Dreams
          </h2>
          <GoldDivider ornament="✦" />
          <ul className="space-y-6 font-serif-elegant text-xl text-foreground sm:text-2xl">
            <li className="flex items-start gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <div>
                <strong className="font-display text-lg tracking-wide text-primary">Dream One:</strong>{" "}
                <span className="leading-relaxed">To become a professional football player, wearing the Blaugrana colors and playing for</span>{" "}
                <span className="text-gold-gradient font-display">FC Barcelona</span>
                <span className="leading-relaxed"> — scoring goals at Camp Nou in front of thousands of cheering fans.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-script text-2xl text-accent">✧</span>
              <div>
                <strong className="font-display text-lg tracking-wide text-primary">Dream Two:</strong>{" "}
                <span className="leading-relaxed">To be a</span>{" "}
                <span className="text-gold-gradient font-display">White Hat Hacker</span>
                <span className="leading-relaxed"> working alongside the government, protecting national systems and defending cyberspace as a guardian of</span>{" "}
                <span className="text-gold-gradient font-display">Cybersecurity</span>
                <span className="leading-relaxed">.</span>
              </div>
            </li>
          </ul>
        </div>
      </AnimatedSection>
    </main>
  );
};

export default Dreams;
