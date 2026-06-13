import { useState } from "react";
import { AnimatedSection, GoldCorners, GoldDivider, GoldNav } from "@/components/GoldUI";
import TicTacToe from "@/components/games/TicTacToe";
import GeometryDash from "@/components/games/GeometryDash";
import Uno from "@/components/games/Uno";
import DevilGame from "@/components/games/DevilGame";

type GameKey = "xo" | "dash" | "uno" | "devil";

const GAMES: { key: GameKey; title: string; icon: string; desc: string }[] = [
  { key: "xo", title: "Tic Tac Toe", icon: "✖️⭕", desc: "Beat the unbeatable computer" },
  { key: "dash", title: "Geometry Dash", icon: "🟨", desc: "Jump over the golden spikes" },
  { key: "uno", title: "Uno", icon: "🃏", desc: "Card duel vs the computer" },
  { key: "devil", title: "Live the Devil", icon: "😈", desc: "Dodge the falling devils" },
];

const MiniGames = () => {
  const [active, setActive] = useState<GameKey | null>(null);

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <GoldNav />

      <AnimatedSection className="mx-auto max-w-4xl">
        <h2 className="text-glow font-display mb-2 text-center text-3xl font-bold tracking-wide text-gold-gradient sm:text-4xl">
          Mini Games
        </h2>
        <p className="text-center font-serif-elegant text-lg italic text-accent/90">
          A small golden arcade — pick a game and play.
        </p>
        <GoldDivider ornament="✦" />

        {!active && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {GAMES.map((g, i) => (
              <button
                key={g.key}
                onClick={() => setActive(g.key)}
                className="group relative animate-fade-in rounded-lg border border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/70"
                style={{
                  boxShadow: "var(--shadow-glow)",
                  animationDelay: `${150 + i * 120}ms`,
                  animationFillMode: "both",
                }}
              >
                <GoldCorners />
                <div className="mb-3 text-3xl">{g.icon}</div>
                <h3 className="font-display text-xl tracking-wide text-gold-gradient">{g.title}</h3>
                <p className="mt-1 font-serif-elegant text-base text-muted-foreground">{g.desc}</p>
                <span className="mt-3 inline-block font-display text-sm text-accent transition-transform group-hover:translate-x-1">
                  Play →
                </span>
              </button>
            ))}
          </div>
        )}

        {active && (
          <div
            className="relative rounded-lg border border-border/60 bg-card/80 p-6 backdrop-blur-sm sm:p-8"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <GoldCorners />
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="font-display text-xl tracking-wide text-gold-gradient text-glow sm:text-2xl">
                {GAMES.find((g) => g.key === active)?.title}
              </h3>
              <button
                onClick={() => setActive(null)}
                className="font-display text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                ← All games
              </button>
            </div>
            <div className="flex justify-center">
              {active === "xo" && <TicTacToe />}
              {active === "dash" && <GeometryDash />}
              {active === "uno" && <Uno />}
              {active === "devil" && <DevilGame />}
            </div>
          </div>
        )}
      </AnimatedSection>
    </main>
  );
};

export default MiniGames;
