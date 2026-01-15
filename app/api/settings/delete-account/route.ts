/**
 * Delete Account API
 * Permanently deletes user account and all associated data
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface DeleteAccountRequest {
  password: string;
}

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

    // Parse request body
    const body: DeleteAccountRequest = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to confirm account deletion" },
        { status: 400 }
      );
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    console.log(`[Delete Account] Deleting account for user: ${user.id}`);

    // Delete all user data from all tables
    // Note: Most tables have ON DELETE CASCADE, but we'll delete explicitly to be safe
    const supabaseAdmin = getSupabaseAdmin();

    const deletions = await Promise.allSettled([
      // Delete analyses (blueprint cache)
      supabaseAdmin.from("analyses").delete().eq("user_id", user.id),
      
      // Delete onboarding paths
      supabaseAdmin.from("onboarding_paths").delete().eq("user_id", user.id),
      
      // Delete impact analyses
      supabaseAdmin.from("impact_analyses").delete().eq("user_id", user.id),
      
      // Delete generated documentation
      supabaseAdmin.from("generated_documentation").delete().eq("user_id", user.id),
      
      // Delete user usage tracking
      supabaseAdmin.from("user_usage").delete().eq("user_id", user.id),
    ]);

    // Log any errors (but don't fail - CASCADE will handle it)
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
      console.warn("[Delete Account] Some deletions had errors (CASCADE will handle):", errors);
    }

    // Delete the user from Supabase Auth (this will trigger CASCADE on all related tables)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error("[Delete Account] Error deleting user:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    console.log(`[Delete Account] Successfully deleted account for user: ${user.id}`);

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Account] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
