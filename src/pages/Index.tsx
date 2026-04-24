import { FormEvent } from "react";

const Index = () => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-sm rounded-lg bg-card p-8 text-center"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <h1 className="text-3xl font-bold text-primary">Connexion</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-primary">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              placeholder="Entrez votre nom"
              className="mt-1 w-full rounded-md bg-input px-3 py-2 text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="Entrez votre mot de passe"
              className="mt-1 w-full rounded-md bg-input px-3 py-2 text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
};

export default Index;
