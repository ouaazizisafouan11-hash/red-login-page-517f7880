import { useAuth } from "@/hooks/useAuth";
import PersonalInfo from "@/components/PersonalInfo";

const Accueil = () => {
  const { user, signOut } = useAuth();
  const username =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Utilisateur";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
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
