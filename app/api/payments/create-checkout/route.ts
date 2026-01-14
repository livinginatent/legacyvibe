/**
 * Dodo Payments Checkout Session Creation
 * Creates a checkout session for one-time $14.99 payment using official SDK
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { getDodo, LEGACYVIBE_PRODUCT_ID } from "@/lib/dodo/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check if product ID is configured
    if (!LEGACYVIBE_PRODUCT_ID) {
      console.error("DODO_PAYMENTS_PRODUCT_ID is not set");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase" },
        { status: 401 }
      );
    }

    const customerEmail = user.email || "";
    const customerName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer";

    // Verify environment configuration
    const isLiveMode = process.env.DODO_LIVE_MODE === "true";
    const hasApiKey = !!process.env.DODO_PAYMENTS_API_KEY;
    const hasProductId = !!LEGACYVIBE_PRODUCT_ID;
    const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;

    console.log(`[Checkout] Configuration check:`, {
      environment: isLiveMode ? "live" : "test",
      hasApiKey,
      hasProductId,
      hasSiteUrl,
      productId: LEGACYVIBE_PRODUCT_ID,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    });

    if (!hasApiKey) {
      console.error("[Checkout] Missing DODO_PAYMENTS_API_KEY");
      return NextResponse.json(
        { error: "Payment system configuration error" },
        { status: 500 }
      );
    }

    if (!hasProductId) {
      console.error("[Checkout] Missing DODO_PAYMENTS_PRODUCT_ID");
      return NextResponse.json(
        { error: "Product configuration error" },
        { status: 500 }
      );
    }

    if (!hasSiteUrl) {
      console.error("[Checkout] Missing NEXT_PUBLIC_SITE_URL");
      return NextResponse.json(
        { error: "Site URL configuration error" },
        { status: 500 }
      );
    }

    // Check if user already has active scans (optional - allow re-purchase)
    const { data: usage } = await supabase
      .from("user_usage")
      .select("has_paid, scans_used, scans_limit")
      .eq("user_id", user.id)
      .single();

    // Allow re-purchase if they've used all scans
    const needsPayment =
      !usage?.has_paid || (usage && usage.scans_used >= usage.scans_limit);

    if (!needsPayment && usage?.has_paid) {
      return NextResponse.json(
        { error: "You still have scans available" },
        { status: 400 }
      );
    }

    const dodo = getDodo();

    console.log(
      `[Checkout] Creating session for user ${user.id} (${customerEmail})`
    );
    console.log(`[Checkout] Product ID: ${LEGACYVIBE_PRODUCT_ID}`);
    console.log(
      `[Checkout] Return URL: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/action/payment-success`
    );

    // Create a Dodo Payments Checkout Session using official SDK
    try {
      const session = await dodo.checkoutSessions.create({
        product_cart: [
          {
            product_id: LEGACYVIBE_PRODUCT_ID,
            quantity: 1,
          },
        ],
        customer: {
          email: customerEmail,
          name: customerName,
        },
        // Return URL after successful payment
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/action/payment-success`,
        // Pass user ID in metadata for webhook
        metadata: {
          supabase_user_id: user.id,
        },
      });

      if (!session.checkout_url) {
        console.error("No checkout URL returned from Dodo:", session);
        return NextResponse.json(
          { error: "Failed to generate checkout URL" },
          { status: 500 }
        );
      }

      // Store pending payment info
      await supabase.from("user_usage").upsert(
        {
          user_id: user.id,
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      return NextResponse.json({ checkoutUrl: session.checkout_url });
    } catch (paymentError: unknown) {
      console.error("Error creating Dodo checkout session:", paymentError);

      // Extract more detailed error information
      let errorMessage = "Unknown error";
      let statusCode = 500;

      if (paymentError instanceof Error) {
        errorMessage = paymentError.message;

        // Check if it's a 401 error (authentication issue)
        if (
          errorMessage.includes("401") ||
          errorMessage.toLowerCase().includes("unauthorized")
        ) {
          statusCode = 401;
          errorMessage =
            "Authentication failed with payment provider. Please verify your API key is correct for live mode.";
          console.error("[Checkout] 401 Error - Possible causes:");
          console.error(
            "  1. API key doesn't match the environment (test vs live)"
          );
          console.error("  2. API key is incorrect or expired");
          console.error("  3. Product ID doesn't exist in live mode");
          console.error(`  Current mode: ${isLiveMode ? "live" : "test"}`);
        }
      }

      // Log the full error for debugging
      if (paymentError && typeof paymentError === "object") {
        console.error(
          "[Checkout] Full error object:",
          JSON.stringify(paymentError, null, 2)
        );
      }

      return NextResponse.json(
        { error: `Checkout creation failed: ${errorMessage}` },
        { status: statusCode }
      );
    }
  } catch (error: unknown) {
    console.error("Unexpected error in checkout:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Checkout failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
