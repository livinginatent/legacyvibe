/**
 * Vibe History API Endpoint
 * Analyzes chat history and links conversations to code changes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  parseChatHistory,
  extractCodeRelatedMessages,
  ParsedMessage,
} from "@/services/chatParser";
import {
  getRecentCommits,
  filterCodeCommits,
  GitCommit,
  CommitFile,
} from "@/services/gitCommits";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for complex analysis

interface VibeHistoryRequest {
  owner: string;
  repo: string;
  installationId: string;
  fileContent: string;
  fileName: string;
  forceReanalyze?: boolean;
}

interface VibeLink {
  id: string;
  chatExcerpt: string;
  codeChanges: Array<{
    file: string;
    changes: string;
    timestamp?: string;
    commit?: string;
  }>;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

// Link without ID, as returned by Claude
type ParsedVibeLink = Omit<VibeLink, "id">;

/**
 * POST /api/vibe-history
 * Analyzes chat history and links conversations to code changes
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

    // Parse request body
    const body: VibeHistoryRequest = await request.json();
    const {
      owner,
      repo,
      installationId,
      fileContent,
      fileName,
      forceReanalyze,
    } = body;

    if (!owner || !repo || !installationId || !fileContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repoFullName = `${owner}/${repo}`;

    // Check for cached analysis (unless force reanalyze)
    if (!forceReanalyze) {
      const { data: cached } = await supabase
        .from("vibe_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        return NextResponse.json({
          vibeLinks: cached.vibe_links,
          totalMessages: cached.total_messages,
          totalChanges: cached.total_changes,
          analyzedAt: cached.analyzed_at,
          cached: true,
        });
      }
    }

    // Step 1: Parse chat history
    console.log("Parsing chat history...");
    console.log(`File name: ${fileName}`);
    console.log(`Content length: ${fileContent.length} characters`);
    console.log(`First 500 chars: ${fileContent.substring(0, 500)}`);

    const parsedChat = parseChatHistory(fileContent, fileName);
    console.log(`Parsed ${parsedChat.messages.length} total messages`);
    console.log(`Format detected: ${parsedChat.format}`);

    if (parsedChat.messages.length > 0) {
      console.log(`First message role: ${parsedChat.messages[0].role}`);
      console.log(
        `First message preview: ${parsedChat.messages[0].content.substring(
          0,
          100
        )}...`
      );
    }

    if (parsedChat.messages.length === 0) {
      return NextResponse.json(
        {
          error: `Failed to parse chat history. The file format may not be supported. Please ensure you've exported the chat correctly from Cursor/Claude. File size: ${fileContent.length} characters.`,
        },
        { status: 400 }
      );
    }

    let codeMessages = extractCodeRelatedMessages(parsedChat.messages);
    console.log(`Found ${codeMessages.length} code-related messages`);

    if (codeMessages.length === 0) {
      // If we have messages but none are code-related, be more lenient
      console.log("No code-related messages found, using all messages anyway");
      codeMessages = parsedChat.messages;
    }

    // Step 2: Fetch recent commits from GitHub
    console.log("Fetching commits from GitHub...");
    let commits;
    try {
      // Get commits from the last 90 days
      const since = new Date();
      since.setDate(since.getDate() - 90);

      const allCommits = await getRecentCommits(owner, repo, installationId, {
        since: since.toISOString(),
        limit: 100,
      });

      commits = filterCodeCommits(allCommits);
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      return NextResponse.json(
        {
          error:
            "Failed to fetch repository commits. Please ensure the GitHub App has access.",
        },
        { status: 500 }
      );
    }

    if (commits.length === 0) {
      return NextResponse.json(
        {
          error: "No code commits found in the repository in the last 90 days",
        },
        { status: 400 }
      );
    }

    // Step 3: Use Claude AI to match conversations to commits
    console.log("Analyzing with Claude AI...");
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const vibeLinks = await analyzeVibeLinks(
      anthropic,
      codeMessages,
      commits,
      repoFullName
    );

    // Step 4: Store results in database
    const now = new Date().toISOString();
    const { error: dbError } = await supabase.from("vibe_history").upsert(
      {
        user_id: user.id,
        repo_full_name: repoFullName,
        owner,
        repo,
        chat_file_name: fileName,
        chat_file_size: fileContent.length,
        vibe_links: vibeLinks,
        total_messages: parsedChat.messages.length,
        total_changes: commits.length,
        analyzed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id, repo_full_name",
      }
    );

    if (dbError) {
      console.error("Failed to store vibe history:", dbError);
      // Continue anyway - return results even if caching fails
    }

    return NextResponse.json({
      vibeLinks,
      totalMessages: parsedChat.messages.length,
      totalChanges: commits.length,
      analyzedAt: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("Vibe history analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Use Claude AI to analyze and link conversations to commits
 */
async function analyzeVibeLinks(
  anthropic: Anthropic,
  messages: ParsedMessage[],
  commits: GitCommit[],
  repoFullName: string
): Promise<VibeLink[]> {
  // Prepare conversation context
  const conversationContext = messages
    .map(
      (msg, idx) =>
        `[Message ${idx + 1}] ${
          msg.role === "user" ? "User" : "Assistant"
        }: ${msg.content.substring(0, 500)}${
          msg.content.length > 500 ? "..." : ""
        }`
    )
    .join("\n\n");

  // Prepare commits context
  const commitsContext = commits
    .map(
      (commit, idx) =>
        `[Commit ${idx + 1}]
SHA: ${commit.sha}
Date: ${commit.date}
Message: ${commit.message}
Files changed: ${commit.files.map((f: CommitFile) => f.filename).join(", ")}
Changes: +${commit.files.reduce(
          (sum: number, f: CommitFile) => sum + f.additions,
          0
        )} -${commit.files.reduce(
          (sum: number, f: CommitFile) => sum + f.deletions,
          0
        )}`
    )
    .join("\n\n");

  const prompt = `You are analyzing a chat history from a coding session and matching conversations to actual code changes in the repository "${repoFullName}".

# Chat History (Code-Related Messages):
${conversationContext}

# Recent Git Commits:
${commitsContext}

# Task:
Identify links between conversations and code changes. For each meaningful connection you find:
1. Extract a relevant excerpt from the conversation (50-150 words)
2. List the related code changes (files and what changed)
3. Explain the reasoning for the link
4. Assign a confidence score (0-100)

Focus on:
- User requests that led to code changes
- Discussions about bugs that were fixed
- Feature implementations that were discussed
- Refactoring conversations

Return your analysis as a JSON array of objects with this structure:
[
  {
    "chatExcerpt": "The conversation excerpt",
    "codeChanges": [
      {
        "file": "path/to/file.ts",
        "changes": "Brief description of what changed",
        "timestamp": "ISO date string",
        "commit": "commit SHA"
      }
    ],
    "reasoning": "Explanation of why these are linked",
    "confidence": 85,
    "timestamp": "ISO date of the conversation or commit"
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse the JSON response
    const linksText = content.text.trim();
    const jsonMatch = linksText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in Claude's response");
    }

    const links = JSON.parse(jsonMatch[0]) as ParsedVibeLink[];

    // Add unique IDs to each link
    return links.map((link: ParsedVibeLink, idx: number) => ({
      id: `link-${Date.now()}-${idx}`,
      ...link,
    }));
  } catch (error) {
    console.error("Claude AI analysis failed:", error);
    // Return empty array on failure
    return [];
  }
}

/**
 * GET /api/vibe-history
 * Retrieves cached vibe history for a repository
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

    const { data, error } = await supabase
      .from("vibe_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ cached: false });
    }

    return NextResponse.json({
      vibeLinks: data.vibe_links,
      totalMessages: data.total_messages,
      totalChanges: data.total_changes,
      analyzedAt: data.analyzed_at,
      cached: true,
    });
  } catch (error) {
    console.error("Failed to retrieve vibe history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
