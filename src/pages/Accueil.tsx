import { useAuth } from "@/hooks/useAuth";
import PersonalInfo from "@/components/PersonalInfo";
import gojo from "@/assets/gojo.png";
import goku from "@/assets/goku.png";

const charImgClass =
  "pointer-events-none fixed z-0 w-auto opacity-70 drop-shadow-[0_0_25px_hsl(0_100%_50%/0.5)]";

const Accueil = () => {
  const { user, signOut } = useAuth();
  const username =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Utilisateur";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      {/* Goku à gauche, Gojo à droite */}
      <img
        src={goku}
        alt="Goku"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} left-0 bottom-0 h-[40vh] sm:h-[55vh] xl:h-[70vh]`}
      />
      <img
        src={gojo}
        alt="Gojo Satoru"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} right-0 bottom-0 h-[40vh] sm:h-[55vh] xl:h-[70vh]`}
      />

      <div className="relative z-10 mx-auto max-w-2xl space-y-6">
        <header
          className="flex items-center justify-between rounded-lg bg-card p-6"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div>
            <p className="text-sm text-accent">Bienvenue,</p>
            <h1 className="text-2xl font-bold text-primary">{username} 👋</h1>
          </div>
          <button
            onClick={signOut}
            className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Déconnexion
          </button>
        </header>

        <PersonalInfo />
      </div>
    </main>
  );
};

export default Accueil;
