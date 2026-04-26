import PersonalInfo from "@/components/PersonalInfo";

const Index = () => {
  const text = "I'm the best in coding";

  return (
    <main className="min-h-screen overflow-hidden px-4 py-10">
      <section className="flex min-h-[60vh] items-center justify-center">
        <h1
          className="text-center text-4xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl"
          aria-label={text}
        >
          {text.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block animate-fade-in"
              style={{
                animationDelay: `${i * 80}ms`,
                animationFillMode: "both",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
      </section>

      <section className="mx-auto mb-10 max-w-2xl">
        <p className="animate-fade-in text-center text-lg leading-relaxed text-accent sm:text-xl">
          I'm honored to meet you. My name is Adnane Aziz, and this is my very first web project. I hope you enjoy it.
        </p>
      </section>

      <section className="mx-auto max-w-2xl space-y-6">
        <PersonalInfo />
      </section>
    </main>
  );
};

export default Index;
