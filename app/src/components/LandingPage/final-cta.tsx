/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";

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
          Ready to Understand Your{" "}
          <span className="text-primary text-glow">Vibe Code</span>?
        </h2>

        <p className="font-mono text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Get started with 5 comprehensive scans per month. With each scan, you can visualize your architecture, 
          track technical debt, analyze impact, and onboard developers.
        </p>

        {/* Pricing Card */}
        <div className="glass-card p-8 max-w-md mx-auto mb-8 glow-border">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-foreground mb-2">
              <span className="text-primary">$14.99</span>
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              per month
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">Repository Scans</span>
              <span className="text-foreground font-semibold">5 per month</span>
            </div>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">Smart Reanalyze</span>
              <span className="text-emerald-400">Unlimited (FREE)</span>
            </div>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-muted-foreground">All Features</span>
              <span className="text-foreground font-semibold">Included</span>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Link href="/login">
            <Button variant="final-cta" className="w-full">
              Start Analyzing Your Codebase
            </Button>
            </Link>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
