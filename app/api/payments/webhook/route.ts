/**
 * Dodo Payments Webhook Handler
 * Verifies and processes payment completion events using standardwebhooks
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Dodo Payments webhook event types - flexible to handle variations
type DodoWebhookPayload = {
  business_id?: string;
  timestamp?: string;
  type?: string;
  event?: string; // Some webhooks use 'event' instead of 'type'
  data?: {
    payment_id?: string;
    id?: string; // Fallback for payment_id
    status?: string;
    customer?: {
      customer_id?: string;
      email?: string;
      name?: string;
    };
    product_id?: string;
    amount?: number;
    total_amount?: number;
    metadata?: Record<string, string>;
  };
  // Top-level fields (some webhooks flatten the data)
  payment_id?: string;
  status?: string;
  customer?: {
    customer_id?: string;
    email?: string;
    name?: string;
  };
  metadata?: Record<string, string>;
};

export async function POST(request: Request) {
  console.log("[Dodo Webhook] Received webhook request");

  let body: string;
  try {
    body = await request.text();
    console.log("[Dodo Webhook] Raw body length:", body.length);
    console.log("[Dodo Webhook] Raw body preview:", body.substring(0, 500));
  } catch (err) {
    console.error("[Dodo Webhook] Failed to read body:", err);
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  const headersList = await headers();

  // Log all headers for debugging
  console.log("[Dodo Webhook] Headers received:");
  const webhookId = headersList.get("webhook-id");
  const webhookTimestamp = headersList.get("webhook-timestamp");
  const webhookSignature = headersList.get("webhook-signature");
  console.log("  webhook-id:", webhookId);
  console.log("  webhook-timestamp:", webhookTimestamp);
  console.log("  webhook-signature:", webhookSignature ? "present" : "missing");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("[Dodo Webhook] Missing webhook headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Dodo Webhook] DODO_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Verify webhook signature using standardwebhooks
  const webhook = new Webhook(webhookSecret);

  let payload: DodoWebhookPayload;

  try {
    payload = webhook.verify(body, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as DodoWebhookPayload;
    console.log("[Dodo Webhook] Signature verified successfully");
  } catch (err) {
    console.error("[Dodo Webhook] Signature verification failed:", err);
    // In development/testing, try to parse without verification
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Dodo Webhook] Development mode - attempting to parse without verification"
      );
      try {
        payload = JSON.parse(body);
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  }

  // Determine event type (handle variations)
  const eventType = payload.type || payload.event || "unknown";
  console.log(`[Dodo Webhook] Event type: ${eventType}`);
  console.log("[Dodo Webhook] Full payload:", JSON.stringify(payload, null, 2));

  try {
    // Handle payment.succeeded or similar events
    if (
      eventType === "payment.succeeded" ||
      eventType === "payment_succeeded" ||
      eventType === "checkout.completed" ||
      eventType === "checkout_completed" ||
      payload.data?.status === "succeeded" ||
      payload.status === "succeeded"
    ) {
      console.log("[Dodo Webhook] Processing payment success event");
      await handlePaymentSucceeded(payload);
    } else if (
      eventType === "payment.failed" ||
      eventType === "payment_failed" ||
      payload.data?.status === "failed" ||
      payload.status === "failed"
    ) {
      console.log("[Dodo Webhook] Processing payment failed event");
      await handlePaymentFailed(payload);
    } else {
      console.log(`[Dodo Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Dodo Webhook] Error processing:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment - grant user 5 scans
 */
async function handlePaymentSucceeded(payload: DodoWebhookPayload) {
  // Extract data from various possible locations
  const data = payload.data;

  const paymentId = data?.payment_id || data?.id || payload.payment_id;
  const amount = data?.amount || data?.total_amount || 1499;

  // Try to get user ID from metadata (check multiple locations)
  const metadata = data?.metadata || payload.metadata;
  const userId = metadata?.supabase_user_id || metadata?.user_id;

  console.log("[Dodo Webhook] Payment data extracted:");
  console.log("  paymentId:", paymentId);
  console.log("  amount:", amount);
  console.log("  userId from metadata:", userId);
  console.log("  metadata:", JSON.stringify(metadata));

  if (!userId) {
    console.error("[Dodo Webhook] No user_id in metadata");

    // Try to find by customer email as fallback
    const customer = data?.customer || payload.customer;
    const email = customer?.email;

    if (email) {
      console.log(`[Dodo Webhook] Attempting to find user by email: ${email}`);
      try {
        const supabase = getSupabaseAdmin();
        const { data: usersData, error } =
          await supabase.auth.admin.listUsers();

        if (error) {
          console.error("[Dodo Webhook] Error listing users:", error);
          return;
        }

        const user = usersData?.users?.find((u) => u.email === email);
        if (user) {
          console.log(`[Dodo Webhook] Found user by email: ${user.id}`);
          await grantScans(user.id, paymentId, amount);
          return;
        } else {
          console.error(`[Dodo Webhook] No user found with email: ${email}`);
        }
      } catch (err) {
        console.error("[Dodo Webhook] Error finding user by email:", err);
      }
    }

    console.error("[Dodo Webhook] Could not identify user for payment");
    return;
  }

  await grantScans(userId, paymentId, amount);
}

/**
 * Grant scans to user and update payment status
 */
async function grantScans(userId: string, paymentId?: string, amount?: number) {
  console.log(`[Dodo Webhook] Granting scans to user: ${userId}`);

  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("user_usage").upsert(
      {
        user_id: userId,
        has_paid: true,
        payment_id: paymentId,
        payment_date: new Date().toISOString(),
        payment_status: "succeeded",
        scans_used: 0,
        scans_limit: 5,
        period_start: new Date().toISOString(),
        period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("[Dodo Webhook] Database error granting scans:", error);
      throw error;
    }

    console.log(`[Dodo Webhook] SUCCESS: Granted 5 scans to user ${userId}`);
  } catch (err) {
    console.error("[Dodo Webhook] Failed to grant scans:", err);
    throw err;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payload: DodoWebhookPayload) {
  const data = payload.data;
  const metadata = data?.metadata || payload.metadata;
  const userId = metadata?.supabase_user_id || metadata?.user_id;

  if (!userId) {
    console.error("[Dodo Webhook] No user_id in metadata for failed payment");
    return;
  }

  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("user_usage")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "[Dodo Webhook] Error updating failed payment status:",
        error
      );
    }

    console.log(`[Dodo Webhook] Payment failed for user ${userId}`);
  } catch (err) {
    console.error("[Dodo Webhook] Failed to update payment status:", err);
  }
}
