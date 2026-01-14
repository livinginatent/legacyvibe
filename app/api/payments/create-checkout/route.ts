/**
 * Dodo Payments Checkout Session Creation
 * Creates a checkout session for one-time $14.99 payment
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

interface CreateCheckoutRequest {
  returnUrl?: string;
}

/**
 * POST /api/payments/create-checkout
 * Creates a Dodo Payments checkout session
 */
export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email and name
    const userEmail = user.email;
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    // Parse request body
    const body: CreateCheckoutRequest = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${request.nextUrl.origin}/dashboard/action/payment-success`;

    // Get Dodo Payments configuration
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID; // Product ID from Dodo dashboard
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode"; // 'test_mode' or 'live_mode'
    const baseUrl = environment === "test_mode" 
      ? "https://test.dodopayments.com"
      : "https://api.dodopayments.com";

    if (!apiKey) {
      console.error("DODO_PAYMENTS_API_KEY not configured");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    if (!productId) {
      console.error("DODO_PAYMENTS_PRODUCT_ID not configured");
      return NextResponse.json(
        { error: "Product not configured" },
        { status: 500 }
      );
    }

    // Check if user already has an active payment
    const { data: usage } = await supabase
      .from("user_usage")
      .select("has_paid, payment_status")
      .eq("user_id", user.id)
      .single();

    // Allow re-purchase if they've used all scans
    const { data: currentUsage } = await supabase
      .from("user_usage")
      .select("scans_used, scans_limit")
      .eq("user_id", user.id)
      .single();

    const needsPayment = !usage?.has_paid || 
      (currentUsage && currentUsage.scans_used >= currentUsage.scans_limit);

    if (!needsPayment && usage?.has_paid) {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      );
    }

    // Create checkout session with Dodo Payments
    const checkoutResponse = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email: userEmail,
          name: userName,
        },
        return_url: returnUrl,
        metadata: {
          user_id: user.id,
          payment_type: "one_time",
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      console.error("Dodo Payments checkout creation failed:", errorData);
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: errorData,
        },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();

    if (!checkoutData.checkout_url) {
      console.error("No checkout_url in response:", checkoutData);
      return NextResponse.json(
        { error: "Invalid checkout session response" },
        { status: 500 }
      );
    }

    // Store pending payment info (optional, for tracking)
    await supabase.from("user_usage").upsert(
      {
        user_id: user.id,
        payment_status: "pending",
        payment_id: checkoutData.checkout_id || checkoutData.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    return NextResponse.json({
      checkoutUrl: checkoutData.checkout_url,
      checkoutId: checkoutData.checkout_id || checkoutData.id,
      environment,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
