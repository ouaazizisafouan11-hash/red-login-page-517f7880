const Index = () => {
  const text = "I'm the best in coding";

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden px-4">
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
    </main>
  );
};

export default Index;
