/**
 * Dodo Payments Webhook Handler
 * Verifies and processes payment completion events using standardwebhooks
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.DODO_WEBHOOK_SECRET!;

// Dodo Payments webhook event types
type DodoWebhookEvent = {
  business_id: string;
  timestamp: string;
  type: string;
  data: {
    payment_id?: string;
    status?: string;
    customer?: {
      customer_id: string;
      email: string;
      name?: string;
    };
    product_id?: string;
    amount?: number;
    metadata?: Record<string, string>;
  };
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();

  // Get webhook headers
  const webhookId = headersList.get("webhook-id");
  const webhookTimestamp = headersList.get("webhook-timestamp");
  const webhookSignature = headersList.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("[Dodo Webhook] Missing webhook headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error("[Dodo Webhook] DODO_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Verify webhook signature using standardwebhooks
  const webhook = new Webhook(webhookSecret);

  let event: DodoWebhookEvent;

  try {
    event = webhook.verify(body, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as DodoWebhookEvent;
  } catch (err) {
    console.error("[Dodo Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log(`[Dodo Webhook] Received event: ${event.type}`);
  console.log(
    `[Dodo Webhook] Event data:`,
    JSON.stringify(event.data, null, 2)
  );

  try {
    switch (event.type) {
      case "payment.succeeded": {
        await handlePaymentSucceeded(event);
        break;
      }

      case "payment.failed": {
        await handlePaymentFailed(event);
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${event.type}`);
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
async function handlePaymentSucceeded(event: DodoWebhookEvent) {
  const userId = event.data.metadata?.supabase_user_id;
  const paymentId = event.data.payment_id;
  const amount = event.data.amount || 1499; // Default to $14.99 in cents

  if (!userId) {
    console.error("[Dodo Webhook] No supabase_user_id in metadata");
    // Try to find by customer email as fallback
    const email = event.data.customer?.email;
    if (email) {
      const { data } = await supabaseAdmin.auth.admin.listUsers();
      const user = data?.users?.find((u) => u.email === email);
      if (user) {
        await grantScans(user.id, paymentId, amount);
        return;
      }
    }
    return;
  }

  await grantScans(userId, paymentId, amount);
}

/**
 * Grant scans to user and update payment status
 */
async function grantScans(userId: string, paymentId?: string, amount?: number) {
  const { error } = await supabaseAdmin.from("user_usage").upsert(
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

  if (error) {
    console.error("[Dodo Webhook] Error granting scans:", error);
    throw error;
  }

  console.log(
    `[Dodo Webhook] Granted 5 scans to user ${userId} (payment: ${paymentId})`
  );
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: DodoWebhookEvent) {
  const userId = event.data.metadata?.supabase_user_id;

  if (!userId) {
    console.error(
      "[Dodo Webhook] No supabase_user_id in metadata for failed payment"
    );
    return;
  }

  const { error } = await supabaseAdmin
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
}
