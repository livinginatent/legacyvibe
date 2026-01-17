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
  createRepositoryChunks,
  formatChunkForAI,
  fetchFileContents,
  type RepositoryChunk,
  type FileNode,
} from "@/services/blueprintOrchestrator";
import { hasNewCommits } from "@/services/githubCommitChecker";

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
  smartReanalyze?: boolean; // Check for changes first (doesn't count against limit)
  comprehensiveMode?: boolean; // Enable multi-pass deep analysis
}

interface ChunkAnalysis {
  chunkId: string;
  chunkName: string;
  nodes: FeatureNode[];
  edges: FeatureEdge[];
  insights: string[];
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
    const {
      owner,
      repo,
      installationId,
      forceRescan,
      smartReanalyze,
      comprehensiveMode = true,
    } = body;

    if (!owner || !repo || !installationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const repoFullName = `${owner}/${repo}`;

    console.log(
      `[Analysis] Mode: ${
        comprehensiveMode ? "COMPREHENSIVE" : "FAST"
      } for ${repoFullName}`
    );

    // Check for cached analysis
    const { data: cached } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    // Smart Reanalyze: Check if there are actual changes
    if (smartReanalyze && cached) {
      console.log("[Smart Reanalyze] Checking for new commits...");
      const hasChanges = await hasNewCommits(
        owner,
        repo,
        installationId,
        cached.analyzed_at
      );

      if (!hasChanges) {
        console.log(
          "[Smart Reanalyze] No new commits found, returning cached analysis"
        );
        return NextResponse.json({
          blueprint: cached.analysis,
          analyzedAt: cached.analyzed_at,
          cached: true,
          drift: null,
          noChanges: true,
          message: "No new commits since last analysis",
        });
      }

      console.log(
        "[Smart Reanalyze] New commits detected, proceeding with analysis (FREE)"
      );
      // Continue to analysis - smart reanalyze doesn't count against limit
    } else if (!forceRescan && cached) {
      // Normal cached response
      return NextResponse.json({
        blueprint: cached.analysis,
        analyzedAt: cached.analyzed_at,
        cached: true,
        drift: null,
      });
    }

    // Check and update usage limits (only for new scans or force rescans)
    if (!smartReanalyze) {
      // Initialize/reset usage if needed
      await supabase.rpc("check_and_reset_usage", { p_user_id: user.id });

      // Get current usage
      const { data: usage, error: usageError } = await supabase
        .from("user_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (usageError && usageError.code !== "PGRST116") {
        console.error("Failed to check usage:", usageError);
        return NextResponse.json(
          { error: "Failed to check usage limits" },
          { status: 500 }
        );
      }

      // Check if user has paid (required for first-time use)
      if (!usage?.has_paid) {
        return NextResponse.json(
          {
            error: "PAYMENT_REQUIRED",
            message:
              "Please complete the one-time $14.99 payment to unlock 5 blueprint scans. Other features (blast radius, onboarding, docs) are unlimited.",
            requiresPayment: true,
          },
          { status: 402 } // 402 Payment Required
        );
      }

      // Check if blueprint scan limit exceeded (5 scans)
      const blueprintScansLimit = usage?.scans_limit || 5;
      if (usage && usage.scans_used >= blueprintScansLimit) {
        return NextResponse.json(
          {
            error: "USAGE_LIMIT_REACHED",
            message: `You've used all ${blueprintScansLimit} blueprint scans. Pay $14.99 to unlock 5 more blueprint scans. Other features (blast radius, onboarding, docs) are unlimited.`,
            usage: {
              used: usage.scans_used,
              limit: blueprintScansLimit,
              resetDate: usage.period_end,
            },
            requiresPayment: true,
          },
          { status: 429 }
        );
      }

      // Increment blueprint scan usage counter
      const newScansUsed = (usage?.scans_used || 0) + 1;
      const { error: upsertError } = await supabase.from("user_usage").upsert(
        {
          user_id: user.id,
          scans_used: newScansUsed,
          scans_limit: 5, // Blueprint scans limit
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (upsertError) {
        console.error("Failed to update usage:", upsertError);
        // Don't fail the request, just log the error
      } else {
        console.log(`[Usage] Blueprint scan ${newScansUsed}/5 for user ${user.id}`);
      }
    }

    // Create streaming response for progress updates
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendProgress = (message: string, step?: string) => {
          const data = JSON.stringify({ type: "progress", message, step });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const sendError = (error: string) => {
          const data = JSON.stringify({ type: "error", error });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        };

        const sendComplete = (result: any) => {
          const data = JSON.stringify({ type: "complete", ...result });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        };

        try {
          // Step 1: INGEST - Fetch file tree and manifests
          sendProgress("Fetching repository structure...", "ingest");
          const [fileTree, manifests] = await Promise.all([
            fetchFileTree(owner, repo, installationId),
            fetchManifests(owner, repo, installationId),
          ]);

          sendProgress(
            `Found ${fileTree.length} files and ${manifests.length} manifest files`,
            "ingest"
          );

          // Initialize Claude client
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });

          const manifestsStr = formatManifestsForAI(manifests);
          let blueprint: BlueprintGraph;

          // Choose analysis strategy based on mode
          if (comprehensiveMode) {
            sendProgress(
              "🔍 COMPREHENSIVE MODE: Starting deep analysis...",
              "comprehensive"
            );
            blueprint = await comprehensiveAnalysisWithProgress(
              anthropic,
              owner,
              repo,
              installationId,
              repoFullName,
              fileTree,
              manifestsStr,
              sendProgress
            );
          } else {
            sendProgress("⚡ FAST MODE: Starting quick analysis...", "fast");
            const fileTreeStr = formatFileTreeForAI(fileTree);
            blueprint = await fastAnalysisWithProgress(
              anthropic,
              repoFullName,
              fileTreeStr,
              manifestsStr,
              sendProgress
            );
          }

          // Step 3: GRAPHING - Validate structure
          sendProgress("Validating blueprint structure...", "validate");
          try {
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
            sendProgress(
              `✅ Found ${blueprint.nodes.length} features and ${blueprint.edges.length} connections`,
              "validate"
            );
          } catch (parseError) {
            throw new Error(
              `Failed to parse blueprint: ${
                parseError instanceof Error
                  ? parseError.message
                  : "Unknown error"
              }`
            );
          }

          // Step 4: DRIFT DETECTION
          let drift: ReturnType<typeof detectArchitecturalDrift> | null = null;

          if (forceRescan) {
            sendProgress("Detecting architectural changes...", "drift");
            const { data: previousAnalysis } = await supabase
              .from("analyses")
              .select("analysis")
              .eq("user_id", user.id)
              .eq("repo_full_name", repoFullName)
              .order("analyzed_at", { ascending: false })
              .limit(1)
              .single();

            if (previousAnalysis && previousAnalysis.analysis) {
              drift = detectArchitecturalDrift(
                previousAnalysis.analysis,
                blueprint
              );
              sendProgress(
                `Found ${drift.addedNodes.length} new features, ${drift.removedNodes.length} removed`,
                "drift"
              );
            }
          }

          // Step 5: CACHING
          sendProgress("Caching results...", "cache");
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
            // Continue anyway
          }

          sendProgress("✅ Analysis complete!", "complete");
          sendComplete({
            blueprint,
            analyzedAt: now,
            cached: false,
            drift,
          });
        } catch (error) {
          console.error("Analysis error:", error);
          sendError(
            error instanceof Error ? error.message : "Internal server error"
          );
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
 * COMPREHENSIVE ANALYSIS - Multi-pass deep dive into repository
 * Chunks the repo, analyzes each chunk deeply (with file contents), then synthesizes
 */
async function comprehensiveAnalysis(
  anthropic: Anthropic,
  owner: string,
  repo: string,
  installationId: string,
  repoFullName: string,
  fileTree: FileNode[],
  manifestsStr: string
): Promise<BlueprintGraph> {
  // Step 1: Create intelligent chunks
  console.log("📦 Creating repository chunks...");
  const chunks = createRepositoryChunks(fileTree, 120000); // 120K tokens per chunk
  console.log(`Created ${chunks.length} chunks for analysis`);

  // Step 2: Analyze each chunk
  const chunkAnalyses: ChunkAnalysis[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(
      `\n🔍 Analyzing chunk ${i + 1}/${chunks.length}: ${chunk.name}`
    );
    console.log(
      `   Files: ${chunk.files.length}, Est. tokens: ${chunk.estimatedTokens}`
    );

    try {
      const chunkAnalysis = await analyzeChunk(
        anthropic,
        owner,
        repo,
        installationId,
        chunk,
        manifestsStr,
        i + 1,
        chunks.length
      );

      chunkAnalyses.push(chunkAnalysis);
      console.log(
        `   ✅ Found ${chunkAnalysis.nodes.length} features, ${chunkAnalysis.edges.length} connections`
      );
    } catch (error) {
      console.error(`   ❌ Failed to analyze chunk ${chunk.name}:`, error);
      // Continue with other chunks
    }
  }

  console.log(
    `\n✨ Completed ${chunkAnalyses.length}/${chunks.length} chunk analyses`
  );

  // Step 3: Synthesize all chunks into unified blueprint
  console.log("\n🔮 Synthesizing unified blueprint...");
  const blueprint = await synthesizeBlueprint(
    anthropic,
    repoFullName,
    chunkAnalyses,
    manifestsStr
  );

  console.log(
    `✅ Final blueprint: ${blueprint.nodes.length} features, ${blueprint.edges.length} connections`
  );

  return blueprint;
}

/**
 * COMPREHENSIVE ANALYSIS with progress updates
 */
async function comprehensiveAnalysisWithProgress(
  anthropic: Anthropic,
  owner: string,
  repo: string,
  installationId: string,
  repoFullName: string,
  fileTree: FileNode[],
  manifestsStr: string,
  sendProgress: (message: string, step?: string) => void
): Promise<BlueprintGraph> {
  // Step 1: Create intelligent chunks
  sendProgress("📦 Creating repository chunks...", "chunking");
  const chunks = createRepositoryChunks(fileTree, 120000);
  sendProgress(`Created ${chunks.length} chunks for deep analysis`, "chunking");

  // Step 2: Analyze each chunk
  const chunkAnalyses: ChunkAnalysis[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    sendProgress(
      `Analyzing chunk ${i + 1}/${chunks.length}: ${chunk.name} (${
        chunk.files.length
      } files)`,
      `chunk-${i + 1}`
    );

    try {
      const chunkAnalysis = await analyzeChunk(
        anthropic,
        owner,
        repo,
        installationId,
        chunk,
        manifestsStr,
        i + 1,
        chunks.length
      );

      chunkAnalyses.push(chunkAnalysis);
      sendProgress(
        `✅ Chunk ${i + 1}/${chunks.length} complete: Found ${
          chunkAnalysis.nodes.length
        } features`,
        `chunk-${i + 1}`
      );
    } catch (error) {
      sendProgress(`⚠️ Chunk ${i + 1} failed, continuing...`, `chunk-${i + 1}`);
      console.error(`Failed to analyze chunk ${chunk.name}:`, error);
    }
  }

  sendProgress(
    `✨ Completed ${chunkAnalyses.length}/${chunks.length} chunk analyses`,
    "chunks-complete"
  );

  // Step 3: Synthesize
  sendProgress(
    "🔮 Synthesizing unified blueprint from all chunks...",
    "synthesize"
  );
  const blueprint = await synthesizeBlueprint(
    anthropic,
    repoFullName,
    chunkAnalyses,
    manifestsStr
  );

  sendProgress(
    `✅ Blueprint complete: ${blueprint.nodes.length} features, ${blueprint.edges.length} connections`,
    "synthesize"
  );

  return blueprint;
}

/**
 * Analyzes a single chunk of the repository with deep file content inspection
 */
async function analyzeChunk(
  anthropic: Anthropic,
  owner: string,
  repo: string,
  installationId: string,
  chunk: RepositoryChunk,
  manifestsStr: string,
  chunkNum: number,
  totalChunks: number
): Promise<ChunkAnalysis> {
  // Format chunk structure
  const chunkStr = formatChunkForAI(chunk);

  // Fetch actual file contents for key files (entry points, configs, main logic)
  console.log(`   📄 Fetching file contents for deep analysis...`);
  const keyFiles = chunk.files
    .filter((f) => {
      // Prioritize entry points, API routes, services, models
      return f.path.match(
        /(index|main|app|route|service|model|controller|handler)\.(tsx?|jsx?|py|java|go|rs)$/i
      );
    })
    .slice(0, 20); // Limit to 20 most important files

  const fileContents = await fetchFileContents(
    owner,
    repo,
    installationId,
    keyFiles.map((f) => f.path),
    150 // 150KB max file size
  );

  console.log(`   📄 Fetched ${fileContents.size} file contents`);

  // Format file contents for AI
  let fileContentsStr = "";
  if (fileContents.size > 0) {
    fileContentsStr = "\n\n=== KEY FILE CONTENTS ===\n\n";
    for (const [path, content] of fileContents.entries()) {
      // Truncate very large files
      const maxContentLength = 10000; // ~10K chars per file
      const truncated =
        content.length > maxContentLength
          ? content.substring(0, maxContentLength) + "\n... (truncated)"
          : content;

      fileContentsStr += `\n--- ${path} ---\n${truncated}\n`;
    }
  }

  const systemPrompt = `You are the "Cadracode Architect" analyzing a SECTION of a larger codebase.

Your task: Extract business features from THIS CHUNK ONLY.

CHUNK INFO:
- Name: ${chunk.name}
- Description: ${chunk.description}
- Part ${chunkNum} of ${totalChunks}

OUTPUT: JSON object with features found in this chunk:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Feature Name",
      "description": "What it does",
      "files": ["key-file-1.ts", "key-file-2.ts"],
      "risk": "High"|"Med"|"Low",
      "vibe": "stable"|"active"|"fragile"|"boilerplate",
      "entryPoints": ["file:function"],
      "conventions": ["pattern to follow"]
    }
  ],
  "edges": [
    {
      "source": "node-id",
      "target": "node-id",
      "label": "connection description",
      "type": "data"|"control"|"config"
    }
  ],
  "insights": ["key insight 1", "key insight 2"]
}

RULES:
1. Focus ONLY on features in this chunk
2. Identify 1-5 features per chunk (don't overdo it)
3. Use actual file contents when available for accuracy
4. Note connections to features that might be in other chunks
5. Return ONLY valid JSON, no markdown`;

  const userPrompt = `Analyze this chunk of ${repo}:

${chunkStr}

${manifestsStr}

${fileContentsStr}

Extract business features from this section. Be specific about what each feature does and how it connects to other parts of the system.`;

  // Call Claude with streaming
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    stream: true,
  });

  // Accumulate response
  let fullText = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
    }
  }

  // Parse JSON
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in chunk analysis for ${chunk.name}`);
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    chunkId: chunk.id,
    chunkName: chunk.name,
    nodes: analysis.nodes || [],
    edges: analysis.edges || [],
    insights: analysis.insights || [],
  };
}

/**
 * Synthesizes multiple chunk analyses into a unified blueprint
 */
async function synthesizeBlueprint(
  anthropic: Anthropic,
  repoFullName: string,
  chunkAnalyses: ChunkAnalysis[],
  manifestsStr: string
): Promise<BlueprintGraph> {
  // Collect all nodes and edges from chunks
  const allNodes: FeatureNode[] = [];
  const allEdges: FeatureEdge[] = [];
  const allInsights: string[] = [];

  for (const analysis of chunkAnalyses) {
    allNodes.push(...analysis.nodes);
    allEdges.push(...analysis.edges);
    allInsights.push(...analysis.insights);
  }

  console.log(
    `   Raw data: ${allNodes.length} nodes, ${allEdges.length} edges from ${chunkAnalyses.length} chunks`
  );

  // Build synthesis prompt
  const chunksummary = chunkAnalyses
    .map(
      (c, i) =>
        `Chunk ${i + 1}: ${c.chunkName} - ${c.nodes.length} features, ${
          c.edges.length
        } connections`
    )
    .join("\n");

  const nodesStr = JSON.stringify(allNodes, null, 2);
  const edgesStr = JSON.stringify(allEdges, null, 2);
  const insightsStr = allInsights.join("\n- ");

  const systemPrompt = `You are the "Cadracode Architect" creating a UNIFIED blueprint from chunk analyses.

Your task: Merge, deduplicate, and refine the partial analyses into ONE coherent system view.

RULES:
1. Merge similar nodes (same feature from different chunks)
2. Keep 5-8 high-level features total (combine granular ones)
3. Validate and fix all edge connections (ensure source/target exist)
4. Use founder-friendly names
5. Ensure no duplicate node IDs
6. Remove internal/implementation edges, keep only business-level connections
7. Return ONLY valid JSON matching the schema

OUTPUT FORMAT:
{
  "nodes": [/* FeatureNode objects */],
  "edges": [/* FeatureEdge objects */]
}

Each node must have: id, label, description, files, risk, vibe, entryPoints, conventions
Each edge must have: source, target, label, type`;

  const userPrompt = `Synthesize these chunk analyses into a unified blueprint for ${repoFullName}:

CHUNKS ANALYZED:
${chunksummary}

RAW NODES (may have duplicates):
${nodesStr}

RAW EDGES:
${edgesStr}

KEY INSIGHTS:
- ${insightsStr}

${manifestsStr}

Create the final unified blueprint. Merge duplicate features, refine connections, and present a clear 5-8 node architecture.`;

  // Call Claude
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    stream: true,
  });

  let fullText = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
    }
  }

  // Parse final blueprint
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in synthesis response");
  }

  const blueprint = JSON.parse(jsonMatch[0]);

  // Validate
  if (!blueprint.nodes || !Array.isArray(blueprint.nodes)) {
    throw new Error("Invalid synthesis: missing nodes array");
  }
  if (!blueprint.edges || !Array.isArray(blueprint.edges)) {
    throw new Error("Invalid synthesis: missing edges array");
  }

  return blueprint;
}

/**
 * FAST ANALYSIS - Single-pass analysis (original approach)
 */
async function fastAnalysis(
  anthropic: Anthropic,
  repoFullName: string,
  fileTreeStr: string,
  manifestsStr: string
): Promise<BlueprintGraph> {
  const systemPrompt = `You are the "Cadracode Architect" - a repo interpreter for developers who need to ship fast and understand intuitively.

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

  // Use streaming
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    stream: true,
  });

  let fullText = "";
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
    }
  }

  if (!fullText) {
    throw new Error("No content received from Claude");
  }

  // Parse JSON
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Claude's response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * FAST ANALYSIS with progress updates
 */
async function fastAnalysisWithProgress(
  anthropic: Anthropic,
  repoFullName: string,
  fileTreeStr: string,
  manifestsStr: string,
  sendProgress: (message: string, step?: string) => void
): Promise<BlueprintGraph> {
  sendProgress("Sending repository structure to AI...", "ai-analysis");

  const systemPrompt = `You are the "Cadracode Architect" - a repo interpreter for developers who need to ship fast and understand intuitively.

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

  sendProgress("Waiting for AI response...", "ai-analysis");

  // Use streaming
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    stream: true,
  });

  let fullText = "";
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
    }
  }

  if (!fullText) {
    throw new Error("No content received from Claude");
  }

  sendProgress("Parsing AI response...", "parse");

  // Parse JSON
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Claude's response");
  }

  return JSON.parse(jsonMatch[0]);
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
