/**
 * Payment Success Page
 * Redirected here after successful Dodo Payments checkout
 */

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import { createClient } from "@/app/src/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scansLimit, setScansLimit] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      // Poll for payment status (webhook may take a few seconds)
      let attempts = 0;
      const maxAttempts = 10;

      const pollPayment = async () => {
        const { data: usage } = await supabase
          .from("user_usage")
          .select("has_paid, payment_status, scans_limit, scans_used")
          .eq("user_id", user.id)
          .single();

        if (usage?.has_paid && usage?.payment_status === "succeeded") {
          setPaymentSucceeded(true);
          setScansLimit(usage.scans_limit || 5);
          setIsLoading(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Poll every 2 seconds
          setTimeout(pollPayment, 2000);
        } else {
          // Stop polling after max attempts
          setIsLoading(false);
        }
      };

      pollPayment();
    };

    checkPaymentStatus();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card border border-primary/30 p-8 max-w-md w-full text-center space-y-6">
        {paymentSucceeded ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-foreground mb-2">
                Payment Successful!
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                Your payment of $14.99 has been processed successfully.
              </p>
            </div>
            <div className="glass-card border border-primary/20 p-4">
              <p className="text-sm font-mono text-foreground mb-2">
                You now have <span className="text-primary font-bold">{scansLimit}</span> scans available
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Start analyzing your repositories right away!
              </p>
            </div>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono">
                Go to Dashboard
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-foreground mb-2">
                {isLoading ? "Processing Payment..." : "Payment Pending"}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                {isLoading
                  ? "Please wait while we confirm your payment. This may take a few seconds."
                  : "Payment confirmation is taking longer than expected. Please check back in a moment."}
              </p>
            </div>
            <div className="glass-card border border-yellow-500/20 p-4">
              <p className="text-xs font-mono text-muted-foreground">
                If payment was successful, this page will update automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1 font-mono"
              >
                Refresh
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full font-mono">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
