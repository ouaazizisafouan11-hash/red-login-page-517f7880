import { useAuth } from "@/hooks/useAuth";
import PersonalInfo from "@/components/PersonalInfo";
import gojo from "@/assets/gojo.png";
import sukuna from "@/assets/sukuna.png";
import tanjiro from "@/assets/tanjiro.png";
import rengoku from "@/assets/rengoku.png";
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
      {/* Personnages d'anime — visibles sur toutes les tailles */}
      <img
        src={gojo}
        alt="Gojo Satoru"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} left-0 top-4 h-[28vh] sm:h-[40vh] xl:h-[55vh]`}
      />
      <img
        src={sukuna}
        alt="Sukuna"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} right-0 top-4 h-[28vh] sm:h-[40vh] xl:h-[55vh]`}
      />
      <img
        src={tanjiro}
        alt="Tanjiro Kamado"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} bottom-0 left-0 h-[24vh] sm:h-[35vh] xl:h-[45vh]`}
      />
      <img
        src={rengoku}
        alt="Kyojuro Rengoku"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} bottom-0 right-0 h-[24vh] sm:h-[35vh] xl:h-[45vh]`}
      />
      <img
        src={goku}
        alt="Goku"
        loading="lazy"
        width={512}
        height={896}
        className={`${charImgClass} bottom-0 left-1/2 h-[20vh] -translate-x-1/2 sm:h-[30vh] xl:h-[40vh]`}
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
