const PersonalDescription = () => {
  return (
    <div
      className="w-full rounded-lg bg-card p-6"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      <h2 className="text-xl font-bold text-primary">À propos de moi</h2>
      <div className="mt-3 space-y-2 text-accent">
        <p>
          Bonjour ! Je suis passionné par le développement web et la création
          d'expériences numériques modernes.
        </p>
        <p>
          J'aime explorer de nouvelles technologies, apprendre en continu, et
          construire des projets qui ont du sens.
        </p>
        <p className="text-sm opacity-80">
          🚀 Toujours curieux · 💡 Créatif · 🎯 Orienté résultats
        </p>
      </div>
    </div>
  );
};

export default PersonalDescription;
