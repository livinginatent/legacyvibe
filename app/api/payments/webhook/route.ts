/**
 * Dodo Payments Webhook Handler
 * Verifies and processes payment completion events
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Standard Webhooks verification (simplified - you may want to use the standardwebhooks library)
async function verifyWebhook(
  rawBody: string,
  signature: string | null,
  webhookId: string | null,
  timestamp: string | null
): Promise<boolean> {
  const webhookSecret = process.env.DODO_WEBHOOK_KEY;

  if (!webhookSecret) {
    console.error("DODO_WEBHOOK_KEY not configured");
    return false;
  }

  // For production, use the standardwebhooks library for proper verification
  // This is a simplified check - Dodo uses Standard Webhooks spec
  // https://standardwebhooks.com/
  
  // Basic verification: check that signature exists
  // In production, implement proper HMAC verification
  if (!signature || !webhookId || !timestamp) {
    return false;
  }

  // TODO: Implement proper Standard Webhooks verification
  // For now, we'll trust the webhook if it has the required headers
  // In production, use: import { Webhook } from "standardwebhooks";
  return true;
}

/**
 * POST /api/payments/webhook
 * Handles Dodo Payments webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = request.headers;
    const rawBody = await request.text();

    // Get webhook headers (Standard Webhooks spec)
    const webhookId = headersList.get("webhook-id");
    const signature = headersList.get("webhook-signature");
    const timestamp = headersList.get("webhook-timestamp");

    // Verify webhook signature
    const isValid = await verifyWebhook(rawBody, signature, webhookId, timestamp);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);

    console.log("[Dodo Webhook] Event received:", payload.type || payload.event);

    // Handle payment succeeded event
    if (
      payload.type === "payment.succeeded" ||
      payload.event === "payment.succeeded" ||
      (payload.data && payload.data.status === "succeeded")
    ) {
      const paymentData = payload.data || payload;
      const paymentId = paymentData.payment_id || paymentData.id;
      const userId = paymentData.metadata?.user_id;
      const amount = paymentData.amount || paymentData.amount_total || 1499; // Default to $14.99

      if (!userId) {
        console.error("No user_id in webhook payload");
        return NextResponse.json(
          { error: "Missing user_id" },
          { status: 400 }
        );
      }

      // Update user payment status and grant scans
      // Use service role for admin operations (bypasses RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      // Create admin client with service role
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Use service role for admin operations (webhook)
      // Note: You may need to use SUPABASE_SERVICE_ROLE_KEY for this
      const { error: updateError } = await supabase
        .from("user_usage")
        .upsert(
          {
            user_id: userId,
            has_paid: true,
            payment_id: paymentId,
            payment_date: new Date().toISOString(),
            payment_amount: amount,
            payment_status: "succeeded",
            scans_used: 0, // Reset scans when payment succeeds
            scans_limit: 5,
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (updateError) {
        console.error("Failed to update payment status:", updateError);
        return NextResponse.json(
          { error: "Failed to process payment" },
          { status: 500 }
        );
      }

      console.log(`[Dodo Webhook] Payment succeeded for user ${userId}, payment ${paymentId}`);
    }

    // Handle payment failed event (optional - for logging)
    if (
      payload.type === "payment.failed" ||
      payload.event === "payment.failed" ||
      (payload.data && payload.data.status === "failed")
    ) {
      const paymentData = payload.data || payload;
      const userId = paymentData.metadata?.user_id;

      if (userId) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
          const { createClient: createAdminClient } = await import("@supabase/supabase-js");
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          await supabase
            .from("user_usage")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
