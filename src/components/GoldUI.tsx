import { useInView } from "@/hooks/useInView";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

/* Voile doré + entrée animée à chaque changement de page */
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [sweepKey, setSweepKey] = useState(0);

  useEffect(() => {
    setSweepKey((k) => k + 1);
  }, [pathname]);

  return (
    <div className="relative">
      <GoldParticles />
      {sweepKey > 0 && <span key={sweepKey} className="gold-sweep" />}
      <div key={pathname} className="animate-page-enter">
        {children}
      </div>
    </div>
  );
};

/* Particules dorées flottantes décoratives */
export const GoldParticles = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 3 + Math.random() * 6,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="gold-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

/* Coins ornementaux dorés à placer dans une carte en position relative */
export const GoldCorners = () => (
  <>
    <span className="gold-corner gold-corner-tl" aria-hidden />
    <span className="gold-corner gold-corner-tr" aria-hidden />
    <span className="gold-corner gold-corner-bl" aria-hidden />
    <span className="gold-corner gold-corner-br" aria-hidden />
  </>
);


export const AnimatedSection = ({
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

export const GoldDivider = ({ ornament = "✦" }: { ornament?: string }) => (
  <div className="gold-divider my-6 text-lg">
    <span className="font-script text-2xl text-accent">{ornament}</span>
  </div>
);

const links = [
  { to: "/", label: "Welcome" },
  { to: "/about", label: "About Me" },
  { to: "/dreams", label: "My Dreams" },
  { to: "/mini-games", label: "Mini Games" },
];

export const GoldNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="mx-auto mb-10 flex max-w-3xl flex-wrap items-center justify-center gap-4 sm:gap-8">
      {links.map((link) => {
        const active = pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`font-display text-base tracking-wide transition-all sm:text-lg ${
              active
                ? "text-gold-gradient text-glow"
                : "text-muted-foreground hover:text-accent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};
