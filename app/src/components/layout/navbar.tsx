import { Button } from "@/app/src/components/ui/button";
import { Cpu } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Cpu className="w-7 h-7 text-primary" />
              <div className="absolute inset-0 blur-md bg-primary/30 rounded-full" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Legacy<span className="text-primary">Vibe</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm font-medium"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm font-medium"
            >
              Pricing
            </a>
          </div>

          {/* CTA Button */}
          <Button variant="default">Scan My Repo</Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
