/**
 * Delete All Cached Data API
 * Removes all cached analyses, onboarding paths, impact analyses, and documentation for the user
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`[Delete Cache] Deleting all cached data for user: ${user.id}`);

    // Delete all cached data tables
    const deletions = await Promise.allSettled([
      // Delete analyses (blueprint cache)
      supabase.from("analyses").delete().eq("user_id", user.id),
      
      // Delete onboarding paths
      supabase.from("onboarding_paths").delete().eq("user_id", user.id),
      
      // Delete impact analyses
      supabase.from("impact_analyses").delete().eq("user_id", user.id),
      
      // Delete generated documentation
      supabase.from("generated_documentation").delete().eq("user_id", user.id),
    ]);

    // Check for errors
    const errors = deletions
      .map((result, index) => {
        if (result.status === "rejected") {
          return `Deletion ${index} failed: ${result.reason}`;
        }
        if (result.value.error) {
          return `Deletion ${index} error: ${result.value.error.message}`;
        }
        return null;
      })
      .filter(Boolean);

    if (errors.length > 0) {
      console.error("[Delete Cache] Errors:", errors);
      return NextResponse.json(
        { error: "Some deletions failed", details: errors },
        { status: 500 }
      );
    }

    // Get counts for logging
    const counts = deletions.map((result) => {
      if (result.status === "fulfilled" && result.value.data) {
        return result.value.data.length || 0;
      }
      return 0;
    });

    console.log(`[Delete Cache] Successfully deleted cached data for user ${user.id}`);
    console.log(`[Delete Cache] Counts: analyses=${counts[0]}, onboarding=${counts[1]}, impact=${counts[2]}, docs=${counts[3]}`);

    return NextResponse.json({
      success: true,
      message: "All cached data deleted successfully",
      deleted: {
        analyses: counts[0],
        onboardingPaths: counts[1],
        impactAnalyses: counts[2],
        documentation: counts[3],
      },
    });
  } catch (error) {
    console.error("[Delete Cache] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
