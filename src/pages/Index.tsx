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

      <section className="mx-auto max-w-2xl space-y-6">
        <PersonalInfo />
      </section>
    </main>
  );
};

export default Index;
