/**
 * API Route to clear GitHub App installation ID
 * This is a Server Action/Route Handler, so it can modify cookies
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/github/clear-installation
 * Clears the GitHub App installation_id from user metadata
 */
export async function POST(request: NextRequest) {
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

    const { error } = await supabase.auth.updateUser({
      data: {
        github_installation_id: null,
      },
    });

    if (error) {
      console.error("Failed to clear installation_id:", error.message);
      return NextResponse.json(
        { error: "Failed to clear installation ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing installation_id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
