import { Github, Brain, Search, ScrollText, Network } from "lucide-react";

const steps = [
  {
    icons: [Github],
    title: "Connect Your Repository",
    description:
      "Connect via GitHub App. We scan your entire codebase structure and files.",
    label: "CONNECT",
  },
  {
    icons: [Brain, Search],
    title: "AI Deep Analysis",
    description:
      "Claude AI analyzes your codebase in chunks, extracts business logic, maps dependencies, and identifies features.",
    label: "ANALYZE",
  },
  {
    icons: [ScrollText, Network],
    title: "Interactive Dashboard",
    description:
      "Visual architecture graph, impact analysis, onboarding paths, documentation, and debt tracking—all in one place.",
    label: "VISUALIZE",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-primary text-glow">Works</span>
          </h2>
          <p className="font-mono text-muted-foreground mb-4">
            Three simple steps to understand your codebase
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute inset-0 data-stream" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Step number node */}
                <div className="hidden lg:flex absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary items-center justify-center z-10">
                  <span className="font-mono text-xs text-primary">
                    {index + 1}
                  </span>
                </div>

                <div className="glass-card p-8 text-center hover:glow-cyan transition-all duration-500 mt-4">
                  {/* Label */}
                  <div className="font-mono text-xs text-primary/60 tracking-widest mb-6">
                    {step.label}
                  </div>

                  {/* Icons */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {step.icons.map((Icon, iconIndex) => (
                      <div
                        key={iconIndex}
                        className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>

                  <p className="font-mono text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
