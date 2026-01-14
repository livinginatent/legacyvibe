/**
 * Onboarding Copilot API - Generates personalized learning paths for new developers
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface OnboardingRequest {
  repoFullName: string;
  userLevel?: "beginner" | "intermediate" | "advanced";
  focusArea?: string;
  forceRegenerate?: boolean;
}

interface LearningStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: "read" | "explore" | "modify" | "test";
  nodeId: string;
  nodeName: string;
  files: string[];
  objectives: string[];
  estimatedTime: number; // in minutes
  prerequisites: string[];
  checkpoints: string[];
  hints: string[];
}

interface OnboardingPath {
  repoFullName: string;
  generatedAt: string;
  totalSteps: number;
  estimatedTotalTime: number;
  learningPath: LearningStep[];
  overview: string;
  keyTakeaways: string[];
}

/**
 * POST /api/onboarding
 * Generates a personalized learning path for onboarding new developers
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
    const body: OnboardingRequest = await request.json();
    const {
      repoFullName,
      userLevel = "intermediate",
      focusArea,
      forceRegenerate,
    } = body;

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [owner, repo] = repoFullName.split("/");

    // Check for cached onboarding path (unless force regenerate)
    if (!forceRegenerate) {
      const { data: cachedPath } = await supabase
        .from("onboarding_paths")
        .select("*")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .eq("user_level", userLevel)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (cachedPath) {
        console.log("Returning cached onboarding path");
        return NextResponse.json({
          repoFullName: cachedPath.repo_full_name,
          generatedAt: cachedPath.generated_at,
          totalSteps: cachedPath.total_steps,
          estimatedTotalTime: cachedPath.estimated_total_time,
          learningPath: cachedPath.learning_path,
          overview: cachedPath.overview,
          keyTakeaways: cachedPath.key_takeaways,
          cached: true,
        });
      }
    }

    // Get the cached blueprint for this repo
    const { data: analysis, error: dbError } = await supabase
      .from("analyses")
      .select("analysis")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError || !analysis) {
      return NextResponse.json(
        {
          error:
            "No blueprint found for this repository. Please analyze it first.",
        },
        { status: 404 }
      );
    }

    const blueprint = analysis.analysis;

    // Generate learning path with Claude
    console.log("Generating onboarding path with Claude AI...");
    const onboardingPath = await generateLearningPath(
      repoFullName,
      blueprint,
      userLevel,
      focusArea
    );

    // Cache the result
    const now = new Date().toISOString();
    const { error: cacheError } = await supabase
      .from("onboarding_paths")
      .upsert(
        {
          user_id: user.id,
          repo_full_name: repoFullName,
          owner,
          repo,
          user_level: userLevel,
          focus_area: focusArea || null,
          learning_path: onboardingPath.learningPath,
          total_steps: onboardingPath.totalSteps,
          estimated_total_time: onboardingPath.estimatedTotalTime,
          overview: onboardingPath.overview,
          key_takeaways: onboardingPath.keyTakeaways,
          generated_at: now,
          updated_at: now,
        },
        {
          onConflict: "user_id,repo_full_name,user_level",
        }
      );

    if (cacheError) {
      console.error("Failed to cache onboarding path:", cacheError);
      // Continue anyway - return results even if caching fails
    } else {
      console.log("Successfully cached onboarding path");
    }

    return NextResponse.json({ ...onboardingPath, cached: false });
  } catch (error) {
    console.error("Onboarding generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generates a learning path using Claude AI
 */
async function generateLearningPath(
  repoFullName: string,
  blueprint: any,
  userLevel: string,
  focusArea?: string
): Promise<OnboardingPath> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are an expert developer onboarding coach. Your goal is to create the PERFECT learning path for a new developer joining a codebase.

PHILOSOPHY: Great onboarding is like a good video game tutorial - start easy, build confidence, gradually increase complexity, and make them feel capable.

INPUT: A Business-Logic Blueprint with features/nodes and their connections
OUTPUT: A JSON learning path with sequential steps

YOUR TASK:
1. Analyze the blueprint to understand the codebase structure
2. Identify the "gateway" features (entry points for understanding)
3. Create a logical progression from simple to complex
4. Include practical exercises (reading, exploring, modifying)
5. Add checkpoints to verify understanding

STEP TYPES:
- "read": Study specific files to understand patterns
- "explore": Navigate through a feature to see how it works
- "modify": Make a small, safe change to apply learning
- "test": Run tests or verify behavior

DIFFICULTY PROGRESSION:
- ${
    userLevel === "beginner"
      ? "Start with foundational concepts, explain basics, more reading steps"
      : ""
  }
- ${
    userLevel === "intermediate"
      ? "Balanced mix of reading and hands-on, assume programming knowledge"
      : ""
  }
- ${
    userLevel === "advanced"
      ? "Focus on architecture patterns, integration, advanced concepts"
      : ""
  }

LEARNING PATH STRUCTURE:
Step 1-2: "Welcome Tour" - Low-risk, stable features to build confidence
Step 3-4: "Core Patterns" - Learn the conventions and patterns
Step 5-6: "Integration Points" - How features connect
Step 7-8: "Make Your Mark" - Safe modifications to apply learning
Step 9+: "Advanced Topics" - Complex or high-risk areas

FOR EACH STEP:
- "id": unique identifier (string, e.g. "step-1")
- "order": number (1, 2, 3...)
- "title": Engaging title (string)
- "description": What they'll learn and why it matters (string)
- "type": "read" | "explore" | "modify" | "test"
- "nodeId": Which blueprint node ID this relates to (string, must match a node.id from the blueprint)
- "nodeName": The feature label (string, must match a node.label from the blueprint)
- "files": array of 3-5 specific file paths (from the node's files array)
- "objectives": array of 3-5 learning objective strings
- "estimatedTime": number of minutes (realistic estimate)
- "prerequisites": array of step IDs that must be completed first (can be empty array for first steps)
- "checkpoints": array of 3-5 verification question strings
- "hints": array of 2-3 helpful tip strings

CRITICAL RULES:
1. Start with STABLE or BOILERPLATE nodes (avoid fragile/active for beginners)
2. Start with LOW RISK nodes first
3. Total path should be 8-12 steps
4. Total time should be 3-6 hours (180-360 minutes)
5. Include at least one "modify" step where they make a change
6. Make it encouraging and confidence-building
7. ${
    focusArea
      ? `Focus the learning path on: ${focusArea}`
      : "Cover the most important features"
  }
8. MUST include top-level fields: overview (string), keyTakeaways (array), learningPath (array), estimatedTotalTime (number)

EXACT JSON STRUCTURE TO RETURN:
{
  "overview": "2-3 sentence summary of the learning journey",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"],
  "estimatedTotalTime": 240,
  "learningPath": [
    {
      "id": "step-1",
      "order": 1,
      "title": "Your First Quest: The User Gateway",
      "description": "Start by understanding...",
      "type": "read",
      "nodeId": "node-id-from-blueprint",
      "nodeName": "Node Label From Blueprint",
      "files": ["file1.ts", "file2.ts"],
      "objectives": ["objective 1", "objective 2", "objective 3"],
      "estimatedTime": 20,
      "prerequisites": [],
      "checkpoints": ["question 1?", "question 2?", "question 3?"],
      "hints": ["hint 1", "hint 2"]
    }
  ]
}

Return ONLY the raw JSON object. No markdown code blocks, no explanation, no preamble.`;

  const userPrompt = `Create an onboarding learning path for this codebase:

REPOSITORY: ${repoFullName}
USER LEVEL: ${userLevel}
${focusArea ? `FOCUS AREA: ${focusArea}` : ""}

BLUEPRINT:
${JSON.stringify(blueprint, null, 2)}

Generate a personalized learning path that will help a new developer understand this codebase and make their first contribution confidently.`;

  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
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

  // Parse the JSON response
  console.log("Claude response length:", fullText.length);
  console.log("First 500 chars:", fullText.substring(0, 500));

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON found in response:", fullText);
    throw new Error("No JSON object found in Claude's response");
  }

  let learningPath: OnboardingPath;
  try {
    learningPath = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("JSON string:", jsonMatch[0].substring(0, 1000));
    throw new Error(
      `Failed to parse Claude's response: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }

  // Validate the structure
  if (!learningPath.learningPath || !Array.isArray(learningPath.learningPath)) {
    console.error(
      "Invalid structure - missing learningPath array:",
      learningPath
    );
    throw new Error("Claude's response is missing the learningPath array");
  }

  if (learningPath.learningPath.length === 0) {
    console.error("Empty learningPath array");
    throw new Error("Claude returned an empty learning path");
  }

  // Get all valid node IDs from blueprint
  const validNodeIds = new Set(blueprint.nodes.map((n: any) => n.id));

  // Validate each step has required fields and references valid nodes
  for (let i = 0; i < learningPath.learningPath.length; i++) {
    const step = learningPath.learningPath[i];

    if (!step.id || !step.title || !step.nodeId) {
      console.error(`Invalid step ${i + 1} structure:`, step);
      throw new Error(
        `Learning step ${
          i + 1
        } is missing required fields (id, title, or nodeId)`
      );
    }

    // Validate nodeId exists in blueprint
    if (!validNodeIds.has(step.nodeId)) {
      console.warn(
        `Step ${step.id} references invalid nodeId: ${step.nodeId}. Available nodes:`,
        Array.from(validNodeIds)
      );
      // Try to find a similar node
      const similarNode = blueprint.nodes.find(
        (n: any) =>
          n.label.toLowerCase().includes(step.nodeName?.toLowerCase() || "") ||
          step.nodeName?.toLowerCase().includes(n.label.toLowerCase())
      );
      if (similarNode) {
        console.log(
          `Correcting nodeId from ${step.nodeId} to ${similarNode.id}`
        );
        step.nodeId = similarNode.id;
        step.nodeName = similarNode.label;
      } else {
        // Fallback to first node
        console.warn(`Using fallback node for step ${step.id}`);
        step.nodeId = blueprint.nodes[0].id;
        step.nodeName = blueprint.nodes[0].label;
      }
    }

    // Ensure arrays exist
    step.files = step.files || [];
    step.objectives = step.objectives || [];
    step.checkpoints = step.checkpoints || [];
    step.hints = step.hints || [];
    step.prerequisites = step.prerequisites || [];

    // Ensure numeric fields
    step.estimatedTime = step.estimatedTime || 15;
    step.order = step.order || i + 1;
  }

  // Add metadata
  learningPath.repoFullName = repoFullName;
  learningPath.generatedAt = new Date().toISOString();
  learningPath.totalSteps = learningPath.learningPath.length;

  // Calculate total time if not provided
  if (!learningPath.estimatedTotalTime) {
    learningPath.estimatedTotalTime = learningPath.learningPath.reduce(
      (sum, step) => sum + (step.estimatedTime || 0),
      0
    );
  }

  // Ensure top-level fields exist
  learningPath.overview =
    learningPath.overview ||
    "A comprehensive learning path through this codebase.";
  learningPath.keyTakeaways = learningPath.keyTakeaways || [
    "Understanding the codebase structure",
  ];

  console.log(
    `Successfully generated learning path with ${learningPath.totalSteps} steps`
  );
  return learningPath;
}

/**
 * GET /api/onboarding
 * Retrieves cached onboarding path for a repository
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
    const userLevel = searchParams.get("userLevel") || "intermediate";

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing repo parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("onboarding_paths")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .eq("user_level", userLevel)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ cached: false });
    }

    return NextResponse.json({
      repoFullName: data.repo_full_name,
      generatedAt: data.generated_at,
      totalSteps: data.total_steps,
      estimatedTotalTime: data.estimated_total_time,
      learningPath: data.learning_path,
      overview: data.overview,
      keyTakeaways: data.key_takeaways,
      cached: true,
    });
  } catch (error) {
    console.error("Failed to retrieve onboarding path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
