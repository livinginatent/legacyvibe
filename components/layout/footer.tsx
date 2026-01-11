import { Cpu } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground">
              Legacy<span className="text-primary">Vibe</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
            >
              Discord
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
            >
              Terms of Service
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-muted-foreground/60">
            © 2026 LegacyVibe. All rights reserved. // v1.0.0-alpha
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
