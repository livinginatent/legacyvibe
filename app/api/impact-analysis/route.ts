/**
 * Impact Analysis API - Analyzes the impact of changing a file
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

interface ImpactAnalysisRequest {
  repoFullName: string;
  filePath: string;
}

interface AffectedNode {
  id: string;
  label: string;
  description: string;
  risk: string;
  impactLevel: "direct" | "indirect" | "downstream";
  reason: string;
}

interface ImpactAnalysisResult {
  targetFile: string;
  directlyAffectedNodes: AffectedNode[];
  indirectlyAffectedNodes: AffectedNode[];
  downstreamNodes: AffectedNode[];
  totalAffectedFeatures: number;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  recommendations: string[];
  affectedEdges: string[];
}

/**
 * POST /api/impact-analysis
 * Analyzes the impact of changing a specific file
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
    const body: ImpactAnalysisRequest = await request.json();
    const { repoFullName, filePath } = body;

    if (!repoFullName || !filePath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [owner, repo] = repoFullName.split("/");

    // Check for cached impact analysis (cached results don't count against limit) (cached results don't count against limit)
    const { data: cachedImpact } = await supabase
      .from("impact_analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .eq("target_file", filePath)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (cachedImpact) {
      console.log("Returning cached impact analysis for:", filePath);
      return NextResponse.json({
        targetFile: cachedImpact.target_file,
        directlyAffectedNodes: cachedImpact.directly_affected_nodes,
        indirectlyAffectedNodes: cachedImpact.indirectly_affected_nodes,
        downstreamNodes: cachedImpact.downstream_nodes,
        totalAffectedFeatures: cachedImpact.total_affected_features,
        riskScore: cachedImpact.risk_score,
        riskLevel: cachedImpact.risk_level,
        recommendations: cachedImpact.recommendations,
        affectedEdges: cachedImpact.affected_edges,
        cached: true,
        analyzedAt: cachedImpact.analyzed_at,
      });
    }

    // Blast radius scans are unlimited - no usage checks needed
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

    // Perform impact analysis (algorithmic)
    const result = analyzeImpact(filePath, blueprint);

    // Enhance with Claude AI for technical details (only if there are affected nodes)
    if (
      result.directlyAffectedNodes.length > 0 ||
      result.indirectlyAffectedNodes.length > 0
    ) {
      try {
        const enhancedResult = await enhanceWithClaude(
          filePath,
          result,
          blueprint
        );
        // Merge enhanced details back into result
        result.directlyAffectedNodes = enhancedResult.directlyAffectedNodes;
        result.indirectlyAffectedNodes = enhancedResult.indirectlyAffectedNodes;
        result.recommendations = enhancedResult.recommendations;
      } catch (error) {
        console.error("Failed to enhance with Claude, using basic analysis:", error);
        // Continue with basic analysis if Claude fails
      }
    }

    // Blast radius scans are unlimited - no usage tracking needed
    // Cache the result
    const now = new Date().toISOString();
    const { error: cacheError } = await supabase.from("impact_analyses").upsert(
      {
        user_id: user.id,
        repo_full_name: repoFullName,
        owner,
        repo,
        target_file: filePath,
        directly_affected_nodes: result.directlyAffectedNodes,
        indirectly_affected_nodes: result.indirectlyAffectedNodes,
        downstream_nodes: result.downstreamNodes,
        affected_edges: result.affectedEdges,
        total_affected_features: result.totalAffectedFeatures,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        recommendations: result.recommendations,
        analyzed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,repo_full_name,target_file",
      }
    );

    if (cacheError) {
      console.error("Failed to cache impact analysis:", cacheError);
      // Continue anyway - return results even if caching fails
    } else {
      console.log("Successfully cached impact analysis");
    }

    return NextResponse.json({ ...result, cached: false, analyzedAt: now });
  } catch (error) {
    console.error("Impact analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Analyzes the impact of changing a file across the blueprint
 */
function analyzeImpact(
  targetFile: string,
  blueprint: any
): ImpactAnalysisResult {
  const directlyAffected: AffectedNode[] = [];
  const indirectlyAffected: AffectedNode[] = [];
  const downstreamNodes: AffectedNode[] = [];
  const affectedEdges: string[] = [];

  // Step 1: Find nodes that directly contain this file
  const directNodeIds = new Set<string>();
  for (const node of blueprint.nodes) {
    const hasFile = node.files.some(
      (file: string) =>
        file.toLowerCase().includes(targetFile.toLowerCase()) ||
        targetFile.toLowerCase().includes(file.toLowerCase())
    );

    if (hasFile) {
      directNodeIds.add(node.id);
      directlyAffected.push({
        id: node.id,
        label: node.label,
        description: node.description,
        risk: node.risk,
        impactLevel: "direct",
        reason: `Contains the file: ${targetFile}`,
      });
    }
  }

  // Step 2: Find nodes that are directly connected to affected nodes
  const indirectNodeIds = new Set<string>();
  for (const edge of blueprint.edges) {
    if (directNodeIds.has(edge.source)) {
      affectedEdges.push(`${edge.source}->${edge.target}`);
      if (
        !directNodeIds.has(edge.target) &&
        !indirectNodeIds.has(edge.target)
      ) {
        indirectNodeIds.add(edge.target);
        const targetNode = blueprint.nodes.find(
          (n: any) => n.id === edge.target
        );
        if (targetNode) {
          indirectlyAffected.push({
            id: targetNode.id,
            label: targetNode.label,
            description: targetNode.description,
            risk: targetNode.risk,
            impactLevel: "indirect",
            reason: `Connected via: ${edge.label}`,
          });
        }
      }
    }
    if (directNodeIds.has(edge.target)) {
      affectedEdges.push(`${edge.source}->${edge.target}`);
      if (
        !directNodeIds.has(edge.source) &&
        !indirectNodeIds.has(edge.source)
      ) {
        indirectNodeIds.add(edge.source);
        const sourceNode = blueprint.nodes.find(
          (n: any) => n.id === edge.source
        );
        if (sourceNode) {
          indirectlyAffected.push({
            id: sourceNode.id,
            label: sourceNode.label,
            description: sourceNode.description,
            risk: sourceNode.risk,
            impactLevel: "indirect",
            reason: `Connected via: ${edge.label}`,
          });
        }
      }
    }
  }

  // Step 3: Find downstream dependencies (2nd degree connections)
  const downstreamNodeIds = new Set<string>();
  for (const edge of blueprint.edges) {
    if (indirectNodeIds.has(edge.source)) {
      if (
        !directNodeIds.has(edge.target) &&
        !indirectNodeIds.has(edge.target) &&
        !downstreamNodeIds.has(edge.target)
      ) {
        downstreamNodeIds.add(edge.target);
        const targetNode = blueprint.nodes.find(
          (n: any) => n.id === edge.target
        );
        if (targetNode) {
          downstreamNodes.push({
            id: targetNode.id,
            label: targetNode.label,
            description: targetNode.description,
            risk: targetNode.risk,
            impactLevel: "downstream",
            reason: "Downstream dependency",
          });
        }
      }
    }
  }

  // Step 4: Calculate risk score
  const riskScore = calculateRiskScore(
    directlyAffected,
    indirectlyAffected,
    downstreamNodes
  );

  // Step 5: Generate recommendations
  const recommendations = generateRecommendations(
    directlyAffected,
    indirectlyAffected,
    downstreamNodes,
    riskScore
  );

  return {
    targetFile,
    directlyAffectedNodes: directlyAffected,
    indirectlyAffectedNodes: indirectlyAffected,
    downstreamNodes,
    totalAffectedFeatures:
      directlyAffected.length +
      indirectlyAffected.length +
      downstreamNodes.length,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    recommendations,
    affectedEdges,
  };
}

/**
 * Calculates a risk score based on affected nodes
 */
function calculateRiskScore(
  direct: AffectedNode[],
  indirect: AffectedNode[],
  downstream: AffectedNode[]
): number {
  let score = 0;

  // Direct impacts have highest weight
  direct.forEach((node) => {
    score += node.risk === "High" ? 30 : node.risk === "Med" ? 20 : 10;
  });

  // Indirect impacts have medium weight
  indirect.forEach((node) => {
    score += node.risk === "High" ? 15 : node.risk === "Med" ? 10 : 5;
  });

  // Downstream impacts have lower weight
  downstream.forEach((node) => {
    score += node.risk === "High" ? 5 : node.risk === "Med" ? 3 : 1;
  });

  return Math.min(score, 100); // Cap at 100
}

/**
 * Determines risk level from score
 */
function getRiskLevel(score: number): "Low" | "Medium" | "High" | "Critical" {
  if (score >= 70) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

/**
 * Generates recommendations based on impact analysis
 */
function generateRecommendations(
  direct: AffectedNode[],
  indirect: AffectedNode[],
  downstream: AffectedNode[],
  riskScore: number
): string[] {
  const recommendations: string[] = [];

  if (direct.length === 0) {
    recommendations.push(
      "✅ This file is not tracked in any critical feature. Changes should be low risk."
    );
    return recommendations;
  }

  if (riskScore >= 70) {
    recommendations.push(
      "🚨 CRITICAL: This change affects core features. Extensive testing required."
    );
    recommendations.push(
      "Consider creating a feature flag to gradually roll out changes."
    );
  }

  if (direct.some((n) => n.risk === "High")) {
    recommendations.push(
      "⚠️ This file is part of HIGH RISK features. Review security and auth implications."
    );
  }

  if (indirect.length > 3) {
    recommendations.push(
      `📊 ${indirect.length} features have indirect dependencies. Update integration tests.`
    );
  }

  if (downstream.length > 0) {
    recommendations.push(
      `🔗 ${downstream.length} downstream features may be affected. Monitor for unexpected behavior.`
    );
  }

  // Check for auth-related features
  const hasAuth = [...direct, ...indirect].some(
    (n) =>
      n.label.toLowerCase().includes("auth") ||
      n.label.toLowerCase().includes("user") ||
      n.label.toLowerCase().includes("gateway")
  );

  if (hasAuth) {
    recommendations.push(
      "🔒 Authentication/Authorization features affected. Verify permission checks."
    );
  }

  // Check for payment-related features
  const hasPayment = [...direct, ...indirect].some(
    (n) =>
      n.label.toLowerCase().includes("payment") ||
      n.label.toLowerCase().includes("money") ||
      n.label.toLowerCase().includes("billing")
  );

  if (hasPayment) {
    recommendations.push(
      "💳 Payment features affected. Extra caution required for financial transactions."
    );
  }

  recommendations.push(
    `✓ Recommended: Run ${
      direct.length + indirect.length
    } feature test suites before deploying.`
  );

  return recommendations;
}

/**
 * Enhances impact analysis with Claude AI for technical details
 * Cost-optimized: Small prompt, focused on key affected nodes only
 */
async function enhanceWithClaude(
  filePath: string,
  result: ImpactAnalysisResult,
  blueprint: any
): Promise<{
  directlyAffectedNodes: AffectedNode[];
  indirectlyAffectedNodes: AffectedNode[];
  recommendations: string[];
}> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Focus on top 5 most critical affected nodes to keep prompt small
  const topDirect = result.directlyAffectedNodes
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      label: n.label,
      description: n.description,
      risk: n.risk,
      files: blueprint.nodes.find((node: any) => node.id === n.id)?.files || [],
    }));

  const topIndirect = result.indirectlyAffectedNodes
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      label: n.label,
      description: n.description,
      risk: n.risk,
      files: blueprint.nodes.find((node: any) => node.id === n.id)?.files || [],
    }));

  const systemPrompt = `You are a senior software engineer analyzing code change impact. Provide specific, technical insights about how changing a file affects other features.

Be concise, technical, and actionable. Focus on:
- Specific technical dependencies (APIs, data structures, interfaces)
- Actual code-level concerns (breaking changes, type mismatches, side effects)
- Real testing requirements (what specific tests need updating)
- Concrete risks (not generic warnings)

Keep responses brief - 1-2 sentences per insight.`;

  const userPrompt = `Analyze the impact of changing file: ${filePath}

DIRECTLY AFFECTED FEATURES (${topDirect.length}):
${topDirect
  .map(
    (n) => `- ${n.label} (${n.risk} risk): ${n.description}
  Files: ${n.files.slice(0, 3).join(", ")}`
  )
  .join("\n")}

INDIRECTLY AFFECTED FEATURES (${topIndirect.length}):
${topIndirect
  .map(
    (n) => `- ${n.label} (${n.risk} risk): ${n.description}
  Files: ${n.files.slice(0, 3).join(", ")}`
  )
  .join("\n")}

RISK SCORE: ${result.riskScore}/100 (${result.riskLevel})

Provide:
1. Enhanced "reason" for each directly affected feature (1 sentence, technical)
2. Enhanced "reason" for each indirectly affected feature (1 sentence, technical)
3. 3-5 specific, actionable recommendations (not generic)

Return JSON only:
{
  "directReasons": { "nodeId": "technical reason string" },
  "indirectReasons": { "nodeId": "technical reason string" },
  "recommendations": ["specific recommendation 1", "specific recommendation 2", ...]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800, // Keep small to reduce cost
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    let responseText = "";
    if (response.content[0].type === "text") {
      responseText = response.content[0].text;
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const enhanced = JSON.parse(jsonMatch[0]);

    // Apply enhanced reasons to nodes
    const enhancedDirect = result.directlyAffectedNodes.map((node) => ({
      ...node,
      reason:
        enhanced.directReasons?.[node.id] ||
        node.reason ||
        `Contains the file: ${filePath}`,
    }));

    const enhancedIndirect = result.indirectlyAffectedNodes.map((node) => ({
      ...node,
      reason:
        enhanced.indirectReasons?.[node.id] ||
        node.reason ||
        "Connected via dependency",
    }));

    return {
      directlyAffectedNodes: enhancedDirect,
      indirectlyAffectedNodes: enhancedIndirect,
      recommendations:
        enhanced.recommendations && Array.isArray(enhanced.recommendations)
          ? enhanced.recommendations
          : result.recommendations,
    };
  } catch (error) {
    console.error("Claude enhancement error:", error);
    // Return original if enhancement fails
    return {
      directlyAffectedNodes: result.directlyAffectedNodes,
      indirectlyAffectedNodes: result.indirectlyAffectedNodes,
      recommendations: result.recommendations,
    };
  }
}

/**
 * GET /api/impact-analysis
 * Retrieves cached impact analysis for a file
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
    const filePath = searchParams.get("file");

    if (!repoFullName || !filePath) {
      return NextResponse.json(
        { error: "Missing repo or file parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("impact_analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .eq("target_file", filePath)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ cached: false });
    }

    return NextResponse.json({
      targetFile: data.target_file,
      directlyAffectedNodes: data.directly_affected_nodes,
      indirectlyAffectedNodes: data.indirectly_affected_nodes,
      downstreamNodes: data.downstream_nodes,
      totalAffectedFeatures: data.total_affected_features,
      riskScore: data.risk_score,
      riskLevel: data.risk_level,
      recommendations: data.recommendations,
      affectedEdges: data.affected_edges,
      cached: true,
      analyzedAt: data.analyzed_at,
    });
  } catch (error) {
    console.error("Failed to retrieve impact analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
