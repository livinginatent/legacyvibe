/**
 * Update Password Page
 * Allows users to set a new password after clicking reset link.
 * Validates password strength and provides user feedback.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/auth/actions";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updatePassword(password);

      if (!result.success) {
        setError(result.error || "Failed to update password");
      } else {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass-card p-8 border-2 border-primary/30 rounded-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Lock className="w-12 h-12 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/50" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Update Password
            </h1>
            <p className="text-sm font-mono text-muted-foreground">
              $ set --new-password --secure
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-mono">
                  Password updated! Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form action={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-mono text-muted-foreground"
                >
                  New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 bg-black/40 border-primary/20 focus:border-primary/50 font-mono text-sm"
                  />
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-mono text-muted-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-10 bg-black/40 border-primary/20 focus:border-primary/50 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

          {/* Password Requirements */}
          <div className="mt-6 pt-6 border-t border-primary/10">
            <p className="text-xs font-mono text-muted-foreground mb-3">
              Password Requirements:
            </p>
            <ul className="space-y-1 text-xs font-mono text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Contains uppercase letter (A-Z)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Contains lowercase letter (a-z)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Contains number (0-9)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
