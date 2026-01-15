import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Cadracode custom variants
        hero: "bg-primary text-primary-foreground font-semibold text-base px-8 py-6 rounded-lg shadow-[0_0_30px_hsl(186_100%_50%/0.4)] hover:shadow-[0_0_50px_hsl(186_100%_50%/0.6)] hover:scale-105 transition-all duration-300",
        "glow-outline":
          "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary shadow-[0_0_20px_hsl(186_100%_50%/0.2)] hover:shadow-[0_0_30px_hsl(186_100%_50%/0.4)] transition-all duration-300",
        "nav-cta":
          "border border-primary/50 bg-transparent text-primary text-sm px-4 py-2 rounded-md hover:bg-primary/10 hover:border-primary shadow-[0_0_15px_hsl(186_100%_50%/0.2)] hover:shadow-[0_0_25px_hsl(186_100%_50%/0.4)] transition-all duration-300",
        "final-cta":
          "bg-primary text-primary-foreground font-bold text-lg px-10 py-7 rounded-xl shadow-[0_0_40px_hsl(186_100%_50%/0.5)] hover:shadow-[0_0_60px_hsl(186_100%_50%/0.7)] hover:scale-105 transition-all duration-300 animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
