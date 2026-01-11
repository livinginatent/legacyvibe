/* eslint-disable react/no-unescaped-entities */
import { Link2Off, Lock, SkullIcon } from "lucide-react";

const problems = [
  {
    icon: Link2Off,
    title: "Fragile Foundations",
    description:
      "One wrong prompt breaks features you don't understand how to fix.",
  },
  {
    icon: Lock,
    title: "Vendor Lock-in",
    description:
      "You can't hire a developer because no one else can read your AI spaghetti code.",
  },
  {
    icon: SkullIcon,
    title: "Hidden Liabilities",
    description:
      "Are there hardcoded API keys or insecure auth flows buried deeper than you looked?",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 circuit-pattern opacity-30" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Vibe Coder's{" "}
            <span className="text-primary text-glow">Dilemma</span>
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="glass-card p-8 glow-border hover:shadow-[0_0_40px_hsl(var(--cyan-glow)/0.3)] transition-all duration-500 group"
            >
              <div className="mb-6">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <problem.icon className="w-7 h-7 text-primary" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">
                {problem.title}
              </h3>

              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
