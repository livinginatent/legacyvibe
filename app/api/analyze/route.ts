/**
 * Blueprint Orchestrator API - Analyzes repository structure and creates business logic graph
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchFileTree,
  fetchManifests,
  formatFileTreeForAI,
  formatManifestsForAI,
} from "@/services/blueprintOrchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for complex analysis

// Graph structure types
interface FeatureNode {
  id: string;
  label: string;
  description: string;
  files: string[];
  risk: "High" | "Med" | "Low";
}

interface FeatureEdge {
  source: string;
  target: string;
  label: string;
}

interface BlueprintGraph {
  nodes: FeatureNode[];
  edges: FeatureEdge[];
}

interface AnalyzeRequest {
  owner: string;
  repo: string;
  installationId: string;
  forceRescan?: boolean;
}

/**
 * POST /api/analyze
 * Analyzes a repository and creates a business logic blueprint
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
    const body: AnalyzeRequest = await request.json();
    const { owner, repo, installationId, forceRescan } = body;

    if (!owner || !repo || !installationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repoFullName = `${owner}/${repo}`;

    // Check for cached analysis (unless force rescan)
    if (!forceRescan) {
      const { data: cached } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        return NextResponse.json({
          blueprint: cached.analysis,
          analyzedAt: cached.analyzed_at,
          cached: true,
          drift: null,
        });
      }
    }

    // Step 1: INGEST - Fetch file tree and manifests
    console.log("Fetching file tree and manifests...");
    const [fileTree, manifests] = await Promise.all([
      fetchFileTree(owner, repo, installationId),
      fetchManifests(owner, repo, installationId),
    ]);

    console.log(
      `Fetched ${fileTree.length} files and ${manifests.length} manifests`
    );

    // Step 2: CONTEXTUALIZE - Send to Claude API
    console.log("Analyzing with Claude AI...");
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const fileTreeStr = formatFileTreeForAI(fileTree);
    const manifestsStr = formatManifestsForAI(manifests);

    const systemPrompt = `You are the "LegacyVibe Architect" - a repo interpreter for developers who need to ship fast and understand intuitively.

INPUT: Filtered file tree + manifest contents
OUTPUT: JSON Business-Logic Graph

YOUR MISSION: Extract the mental model a senior dev would build after 2 weeks in this codebase.

IDENTIFY 5-8 "FEATURE NODES" with founder-friendly names:
For each node, provide:
- "id": unique identifier (lowercase-hyphenated)
- "label": founder-friendly name (e.g., "The User Gateway", "The Money Flow")
- "description": 1-sentence business purpose
- "files": 3 most critical files (prioritize: entry points > core logic > config)
- "risk": "High"/"Med"/"Low" based on:
  * Complexity concentration
  * Change frequency indicators (many imports/exports = active)
  * Critical path positioning (auth, payments = high)
- "vibe": One of:
  * "stable" - mature, rarely touched
  * "active" - frequent changes expected
  * "fragile" - complex, handle with care
  * "boilerplate" - copy this pattern safely
- "entryPoints": Where to START if modifying this feature (file:function or file:component)
- "conventions": Key patterns to follow (e.g., "All mutations use Zod schemas", "Auth checked in middleware")

CONNECTIONS (edges):
- "source" & "target": node IDs
- "label": What data/control flows (be specific: "User ID for transaction auth" not just "provides data")
- "type": "data" | "control" | "config" (helps understand coupling)

PATTERNS TO DETECT:
✓ Auth/authorization (where the gates are)
✓ Data operations (CRUD centers)
✓ Money/payments (critical paths)
✓ External APIs (integration points)
✓ Business rules (the "why" logic lives here)
✓ Media/content handling
✓ Background jobs/async work

PRIORITIZE: Main paths through the code > peripheral utilities. Show where requests FLOW.

CRITICAL: Return ONLY raw JSON. No markdown blocks, no explanations, no preamble.`;

    const userPrompt = `Analyze this repo and build the developer mental model:

REPOSITORY: ${repoFullName}

${fileTreeStr}

${manifestsStr}

Extract the Business-Logic Blueprint focusing on:
1. Where would I START to add a new feature similar to existing ones?
2. Which nodes are the "centers of gravity" vs supporting cast?
3. What are the implicit conventions I should follow?
4. Where are the complexity hotspots?

Return ONLY the raw JSON object matching the schema defined in your instructions.`;
    // Estimate token count (rough estimate: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil((systemPrompt + userPrompt).length / 4);
    console.log(`Estimated tokens: ${estimatedTokens}`);

    // No hard limit - streaming can handle large inputs
    if (estimatedTokens > 190000) {
      console.warn(
        `Large repository detected: ${estimatedTokens} tokens. Using streaming...`
      );
    }

    // Use streaming for large repositories to avoid timeouts
    console.log("Starting streaming analysis...");
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      stream: true,
    });

    // Accumulate the streamed response
    let fullText = "";
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullText += chunk.delta.text;
      }
    }

    console.log(`Received ${fullText.length} characters from Claude`);

    if (!fullText) {
      throw new Error("No content received from Claude");
    }

    // Step 3: GRAPHING - Parse the JSON response
    console.log("Parsing blueprint graph...");
    let blueprint: BlueprintGraph;

    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in Claude's response");
      }

      blueprint = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!blueprint.nodes || !Array.isArray(blueprint.nodes)) {
        throw new Error(
          "Invalid blueprint structure: missing or invalid nodes"
        );
      }
      if (!blueprint.edges || !Array.isArray(blueprint.edges)) {
        throw new Error(
          "Invalid blueprint structure: missing or invalid edges"
        );
      }
    } catch (parseError) {
      console.error(
        "Failed to parse Claude response:",
        fullText.substring(0, 500)
      );
      throw new Error(
        `Failed to parse blueprint: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
    }

    // Step 4: DRIFT DETECTION - Compare with previous scan if exists
    let drift: ReturnType<typeof detectArchitecturalDrift> | null = null;

    if (forceRescan) {
      const { data: previousAnalysis } = await supabase
        .from("analyses")
        .select("analysis")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (previousAnalysis && previousAnalysis.analysis) {
        drift = detectArchitecturalDrift(previousAnalysis.analysis, blueprint);
      }
    }

    // Step 5: CACHING - Store in Supabase
    console.log("Caching blueprint...");
    const now = new Date().toISOString();

    const { error: dbError } = await supabase.from("analyses").upsert(
      {
        user_id: user.id,
        repo_full_name: repoFullName,
        owner,
        repo,
        analysis: blueprint,
        analyzed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id, repo_full_name",
      }
    );

    if (dbError) {
      console.error("Failed to cache blueprint:", dbError);
      // Continue anyway - return results even if caching fails
    }

    return NextResponse.json({
      blueprint,
      analyzedAt: now,
      cached: false,
      drift,
    });
  } catch (error) {
    console.error("Blueprint analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Detects architectural drift between two blueprint graphs
 */
function detectArchitecturalDrift(
  oldBlueprint: BlueprintGraph,
  newBlueprint: BlueprintGraph
): {
  addedNodes: FeatureNode[];
  removedNodes: FeatureNode[];
  modifiedNodes: Array<{ old: FeatureNode; new: FeatureNode }>;
  addedEdges: FeatureEdge[];
  removedEdges: FeatureEdge[];
  riskChanges: Array<{ node: string; oldRisk: string; newRisk: string }>;
} {
  const oldNodeIds = new Set(oldBlueprint.nodes.map((n) => n.id));
  const newNodeIds = new Set(newBlueprint.nodes.map((n) => n.id));

  // Find added and removed nodes
  const addedNodes = newBlueprint.nodes.filter((n) => !oldNodeIds.has(n.id));
  const removedNodes = oldBlueprint.nodes.filter((n) => !newNodeIds.has(n.id));

  // Find modified nodes (risk changes or file changes)
  const modifiedNodes: Array<{ old: FeatureNode; new: FeatureNode }> = [];
  const riskChanges: Array<{ node: string; oldRisk: string; newRisk: string }> =
    [];

  for (const newNode of newBlueprint.nodes) {
    const oldNode = oldBlueprint.nodes.find((n) => n.id === newNode.id);
    if (oldNode) {
      const filesChanged =
        JSON.stringify(oldNode.files.sort()) !==
        JSON.stringify(newNode.files.sort());
      const riskChanged = oldNode.risk !== newNode.risk;

      if (filesChanged || riskChanged) {
        modifiedNodes.push({ old: oldNode, new: newNode });
      }

      if (riskChanged) {
        riskChanges.push({
          node: newNode.label,
          oldRisk: oldNode.risk,
          newRisk: newNode.risk,
        });
      }
    }
  }

  // Find edge changes
  const oldEdgeKeys = new Set(
    oldBlueprint.edges.map((e) => `${e.source}->${e.target}`)
  );
  const newEdgeKeys = new Set(
    newBlueprint.edges.map((e) => `${e.source}->${e.target}`)
  );

  const addedEdges = newBlueprint.edges.filter(
    (e) => !oldEdgeKeys.has(`${e.source}->${e.target}`)
  );
  const removedEdges = oldBlueprint.edges.filter(
    (e) => !newEdgeKeys.has(`${e.source}->${e.target}`)
  );

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    riskChanges,
  };
}

/**
 * GET /api/analyze
 * Retrieves cached blueprint for a repository
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
      .from("analyses")
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
      blueprint: data.analysis,
      analyzedAt: data.analyzed_at,
      cached: true,
      drift: null,
    });
  } catch (error) {
    console.error("Failed to retrieve blueprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
