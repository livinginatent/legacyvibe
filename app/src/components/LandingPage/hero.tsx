/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/app/src/components/ui/button";
import HeroVisual from "./hero-visual";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero-bg" />
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Scan line effect */}
      <div className="scan-line" style={{ animationDelay: "0s" }} />
      <div className="scan-line" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground animate-fade-in-up">
                Scan Your{" "}
                <span className="text-primary text-glow">
                  Vibe Code in Minutes
                </span>
              </h1>

              <p className="font-mono text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in-up animation-delay-200">
                AI-powered architecture analysis of your codebase. Visualize business logic, track technical debt, 
                analyze impact, and onboard new developers—all from one dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
              <Link href="/login">
              <Button variant="hero" size="lg">
                Start Analyzing Your Codebase
              </Button>
              </Link>
            
            </div>

            <div className="flex items-center gap-6 animate-fade-in-up animation-delay-600">
              <p className="font-mono text-sm text-muted-foreground/70">
                <span className="text-primary/80 font-semibold">$14.99</span>{" "}
                <span className="text-muted-foreground/50">/month</span>
              </p>
              <div className="h-4 w-px bg-border" />
              <p className="font-mono text-sm text-muted-foreground/70">
                <span className="text-primary/80">5 scans</span> - Visual Architecture Map, Impact Analysis, Onboarding Paths, Documentation, and Debt Tracking
              </p>
            </div>
          </div>

          {/* Right visual */}
          <div className="hidden lg:block animate-fade-in-up animation-delay-400">
            <HeroVisual />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      
    </section>
  );
};

export default Hero;
