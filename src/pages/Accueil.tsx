import { useAuth } from "@/hooks/useAuth";
import PersonalInfo from "@/components/PersonalInfo";
import gojo from "@/assets/gojo.png";
import sukuna from "@/assets/sukuna.png";
import tanjiro from "@/assets/tanjiro.png";
import rengoku from "@/assets/rengoku.png";

const Accueil = () => {
  const { user, signOut } = useAuth();
  const username =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Utilisateur";

  return (
    <main className="relative min-h-screen px-4 py-10">
      {/* Personnages d'anime — décor latéral, cachés sur petits écrans */}
      <img
        src={gojo}
        alt="Gojo Satoru"
        loading="lazy"
        width={512}
        height={896}
        className="pointer-events-none fixed left-0 top-10 hidden h-[55vh] w-auto opacity-80 drop-shadow-[0_0_25px_hsl(0_100%_50%/0.5)] xl:block"
      />
      <img
        src={tanjiro}
        alt="Tanjiro Kamado"
        loading="lazy"
        width={512}
        height={896}
        className="pointer-events-none fixed bottom-0 left-0 hidden h-[45vh] w-auto opacity-80 drop-shadow-[0_0_25px_hsl(0_100%_50%/0.5)] xl:block"
      />
      <img
        src={sukuna}
        alt="Sukuna"
        loading="lazy"
        width={512}
        height={896}
        className="pointer-events-none fixed right-0 top-10 hidden h-[55vh] w-auto opacity-80 drop-shadow-[0_0_25px_hsl(0_100%_50%/0.5)] xl:block"
      />
      <img
        src={rengoku}
        alt="Kyojuro Rengoku"
        loading="lazy"
        width={512}
        height={896}
        className="pointer-events-none fixed bottom-0 right-0 hidden h-[45vh] w-auto opacity-80 drop-shadow-[0_0_25px_hsl(0_100%_50%/0.5)] xl:block"
      />

      <div className="relative mx-auto max-w-2xl space-y-6">
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
