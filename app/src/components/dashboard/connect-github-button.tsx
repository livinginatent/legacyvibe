/**
 * Connect GitHub Button - Client Component
 * Handles the GitHub App installation flow from the dashboard.
 * Uses server action to redirect to GitHub App installation page.
 */

"use client";

import { useState } from "react";
import { Github, Loader2, Settings } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import { connectGitHub } from "@/app/auth/actions";

interface ConnectGitHubButtonProps {
  variant?: "primary" | "outline";
}

export function ConnectGitHubButton({
  variant = "primary",
}: ConnectGitHubButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connectGitHub();
    } catch (error) {
      // Redirect errors are expected from Next.js
      if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
        console.error("Failed to connect to GitHub");
        setIsLoading(false);
      }
    }
  };

  const buttonClasses =
    variant === "outline"
      ? "border-primary/50 hover:bg-primary/10 hover:border-primary font-mono text-sm"
      : "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono";

  return (
    <form action={handleConnect}>
      <Button
        type="submit"
        variant={variant === "outline" ? "outline" : "default"}
        size={variant === "outline" ? "sm" : "default"}
        disabled={isLoading}
        className={`${buttonClasses} disabled:opacity-50`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            {variant === "outline" ? (
              <Settings className="w-4 h-4 mr-2" />
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            {variant === "outline" ? "Manage Repos" : "Connect GitHub"}
          </>
        )}
      </Button>
    </form>
  );
}
