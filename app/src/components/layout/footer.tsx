
const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
          
            <span className="text-lg font-bold text-foreground">
              Cadra<span className="text-primary">code</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
           
           
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
            © 2026 Cadracode. All rights reserved. // v1.0.0-alpha
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
