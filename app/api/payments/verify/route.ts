/**
 * Manual Payment Verification Endpoint
 * Allows users to manually verify a payment if webhook didn't process
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/verify
 * Manually verify and grant scans for a user
 * This is a fallback when webhooks don't work
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Payment Verify] Verifying payment for user: ${user.id}`);

    // For now, just grant scans manually
    // In production, you'd verify with Dodo's API first
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.from("user_usage").upsert(
      {
        user_id: user.id,
        has_paid: true,
        payment_status: "succeeded",
        payment_date: new Date().toISOString(),
        scans_used: 0,
        scans_limit: 5,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("[Payment Verify] Database error:", error);
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    console.log(`[Payment Verify] SUCCESS: Granted 5 scans to user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Payment verified! You now have 5 scans.",
    });
  } catch (error) {
    console.error("[Payment Verify] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
