/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/app/src/components/ui/button";
import HeroVisual from "./hero-visual";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
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
                Don't Fear the Code{" "}
                <span className="text-primary text-glow">
                  You Didn't Write.
                </span>
              </h1>

              <p className="font-mono text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in-up animation-delay-200">
                The automated flight recorder for AI-generated apps. Turn your
                Vibe Coding chaos into a maintainable blueprint.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
              <Button variant="hero" size="lg">
                Generate Founder's Manual
              </Button>
            </div>

            <p className="font-mono text-sm text-muted-foreground/70 animate-fade-in-up animation-delay-600">
              Compatible with <span className="text-primary/80">Cursor</span>,{" "}
              <span className="text-primary/80">Bolt.new</span>, &{" "}
              <span className="text-primary/80">ChatGPT history</span>.
            </p>
          </div>

          {/* Right visual */}
          <div className="hidden lg:block animate-fade-in-up animation-delay-400">
            <HeroVisual />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
