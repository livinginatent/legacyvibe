/* eslint-disable react/no-unescaped-entities */
/**
 * Login Page - Authentication interface for Cadracode.
 * Provides email/password authentication.
 * Follows tech-vibe-ui aesthetic with glassmorphism and cyan accents.
 * Includes loading states and email verification notifications.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, signUp, getCurrentUser } from "@/app/auth/actions";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        // User is already logged in, redirect to dashboard
        router.push("/dashboard");
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // Check for errors in URL
  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleEmailAuth = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    setVerificationSent(false);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (!result.success) {
          setError(result.error || "Sign up failed");
          // Show field-specific errors if available
          if (result.fieldErrors) {
            const fieldError =
              result.fieldErrors.email || result.fieldErrors.password;
            if (fieldError) setError(fieldError);
          }
        } else {
          // Show email verification message
          setVerificationSent(true);
          setVerificationEmail(email);
        }
      } else {
        const result = await signInWithPassword(email, password);
        if (result && !result.success) {
          setError(result.error || "Sign in failed");
        }
      }
    } catch (err) {
      // Redirect errors are thrown by Next.js - this is expected
      if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Circuit pattern background */}
      <div className="absolute inset-0 circuit-pattern opacity-30 pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

        {/* Card */}
        <div className="relative glass-card p-8 border-2 border-primary/30 rounded-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-sm font-mono text-muted-foreground">
              {isSignUp
                ? "$ initialize --new-user"
                : "$ authenticate --legacy-vibe"}
            </p>
          </div>

          {/* Email Verification Success Message */}
          {verificationSent && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-500 mb-1">
                    Verification Email Sent!
                  </p>
                  <p className="text-xs font-mono text-green-500/80 mb-2">
                    We sent a verification link to{" "}
                    <span className="font-semibold">{verificationEmail}</span>
                  </p>
                  <div className="space-y-1 text-xs font-mono text-green-500/70">
                    <p>• Check your inbox (and spam folder)</p>
                    <p>• Click the verification link</p>
                    <p>• Then return here to sign in</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-mono text-red-500">{error}</p>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form action={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-mono text-muted-foreground"
              >
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="pl-10 bg-black/40 border-primary/20 focus:border-primary/50 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-mono text-muted-foreground"
                >
                  Password
                </Label>
                {!isSignUp && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pl-10 bg-black/40 border-primary/20 focus:border-primary/50 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {isSignUp && (
                <p className="text-xs font-mono text-muted-foreground">
                  8+ chars, uppercase, lowercase, number
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              {isLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-black" />
                  <span>
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setVerificationSent(false);
              }}
              disabled={isLoading}
              className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <span className="text-primary font-semibold">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="text-primary font-semibold">Sign Up</span>
                </>
              )}
            </button>
          </div>

          {/* Forgot Password Link (Prominent) */}
          {!isSignUp && !verificationSent && (
            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group"
              >
                <Lock className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Forgot your password? Reset it here</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-primary/10">
            <p className="text-xs text-center font-mono text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Scan line animation */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 animate-scan-line pointer-events-none" />
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-lg font-mono">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
