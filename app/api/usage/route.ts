/**
 * Usage Status API - Returns current usage limits and statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/usage
 * Returns current user's usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize/reset usage if needed
    await supabase.rpc("check_and_reset_usage", { p_user_id: user.id });

    // Get current usage
    const { data: usage, error: usageError } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (usageError) {
      console.error("Failed to fetch usage:", usageError);
      return NextResponse.json(
        { error: "Failed to fetch usage" },
        { status: 500 }
      );
    }

    const scansRemaining = usage.scans_limit - usage.scans_used;
    const percentageUsed = (usage.scans_used / usage.scans_limit) * 100;
    const isLimitReached = usage.scans_used >= usage.scans_limit;

    // Calculate days until reset
    const now = new Date();
    const resetDate = new Date(usage.period_end);
    const daysUntilReset = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      scansUsed: usage.scans_used,
      scansLimit: usage.scans_limit,
      scansRemaining,
      percentageUsed: Math.round(percentageUsed),
      isLimitReached,
      periodStart: usage.period_start,
      periodEnd: usage.period_end,
      daysUntilReset,
      lastResetAt: usage.last_reset_at,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
