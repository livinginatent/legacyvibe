/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-glow-pulse" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-primary/20 rounded-full blur-[60px] animate-glow-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Secure Your <span className="text-primary text-glow">AI Asset</span>{" "}
          Today
        </h2>

        <p className="font-mono text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Stop hoping your codebase holds together. Start knowing exactly what's
          under the hood.
        </p>

        <Button variant="final-cta">Start Free Scan</Button>
      </div>
    </section>
  );
};

export default FinalCTA;
