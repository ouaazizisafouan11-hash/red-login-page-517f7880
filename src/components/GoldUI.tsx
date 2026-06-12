import { useInView } from "@/hooks/useInView";
import { Link, useLocation } from "react-router-dom";

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
