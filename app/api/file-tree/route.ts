/**
 * File Tree API - Returns a GitHub-like file tree for a repository
 * Used by the Blast Radius feature to let users pick a file.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { fetchFileTree } from "@/services/blueprintOrchestrator";

export const dynamic = "force-dynamic";

/**
 * GET /api/file-tree?repo={owner}/{repo}
 * Returns a filtered file tree for the given repository.
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

    const searchParams = request.nextUrl.searchParams;
    const repoFullName = searchParams.get("repo");

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing repo parameter" },
        { status: 400 }
      );
    }

    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Invalid repo format. Expected owner/repo." },
        { status: 400 }
      );
    }

    const installationId =
      (user.user_metadata as any)?.github_installation_id ?? null;

    if (!installationId) {
      return NextResponse.json(
        {
          error:
            "GitHub App not connected. Please connect your GitHub account from the dashboard.",
        },
        { status: 400 }
      );
    }

    const fileTree = await fetchFileTree(owner, repo, installationId);

    return NextResponse.json({
      repoFullName,
      fileTree,
    });
  } catch (error) {
    console.error("File tree API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch file tree",
      },
      { status: 500 }
    );
  }
}

