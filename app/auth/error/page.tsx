/**
 * Authentication Error Page
 * Displays user-friendly error messages when authentication fails.
 * Does not expose sensitive error details.
 */

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  const errorMessage =
    searchParams.message || "An authentication error occurred";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="glass-card p-8 border-2 border-red-500/30">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <div className="absolute inset-0 blur-lg bg-red-500/30" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-3">
            Authentication Failed
          </h1>

          {/* Error Message */}
          <p className="text-center text-muted-foreground mb-6 font-mono text-sm">
            {errorMessage}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-primary/50"
              size="lg"
            >
              <Link href="/auth/signin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground mt-6 font-mono">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}
