/**
 * Payment Success Page
 * Redirected here after successful Dodo Payments checkout.
 * Immediately triggers manual verification and then sends user to the dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPayment = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Verification failed");
      }

      // On success, go straight to dashboard
      router.replace("/dashboard");
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Verification failed"
      );
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // Auto-verify as soon as the user lands on this page
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card border border-primary/30 p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-mono font-bold text-foreground mb-2">
            Verifying Your Payment...
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            We&apos;re confirming your payment and setting up your scans. You&apos;ll
            be redirected to your dashboard in a moment.
          </p>
        </div>

        {verifyError && (
          <div className="glass-card border border-destructive/30 p-4 space-y-2">
            <p className="text-sm font-mono text-destructive">
              {verifyError}
            </p>
            <Button
              onClick={verifyPayment}
              disabled={isVerifying}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                "Retry Verification"
              )}
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full font-mono">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
