/**
 * Technical Debt Heatmap API
 * Analyzes historical blueprints to track risk trends over time
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

interface HistoricalSnapshot {
  analyzedAt: string;
  nodes: Array<{
    id: string;
    label: string;
    risk: "High" | "Med" | "Low";
    files: string[];
  }>;
  totalNodes: number;
  highRiskCount: number;
  medRiskCount: number;
  lowRiskCount: number;
  riskScore: number; // 0-100
}

interface RiskTrend {
  nodeId: string;
  nodeLabel: string;
  currentRisk: "High" | "Med" | "Low";
  previousRisk?: "High" | "Med" | "Low";
  trend: "increasing" | "decreasing" | "stable" | "new";
  changeDate?: string;
  snapshots: Array<{
    date: string;
    risk: "High" | "Med" | "Low";
  }>;
}

interface DebtHeatmapData {
  repoFullName: string;
  timeRange: {
    from: string;
    to: string;
  };
  snapshots: HistoricalSnapshot[];
  trends: RiskTrend[];
  summary: {
    totalScans: number;
    overallTrend: "improving" | "degrading" | "stable";
    riskScoreDelta: number;
    highRiskAdded: number;
    highRiskRemoved: number;
    mostImprovedNodes: string[];
    mostDegradedNodes: string[];
  };
}

/**
 * GET /api/debt-heatmap
 * Retrieves historical debt analysis for a repository
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
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing repo parameter" },
        { status: 400 }
      );
    }

    // Fetch all historical analyses for this repo
    const { data: analyses, error: dbError } = await supabase
      .from("analyses")
      .select("analysis, analyzed_at")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("Failed to fetch historical analyses:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({
        repoFullName,
        snapshots: [],
        trends: [],
        summary: {
          totalScans: 0,
          overallTrend: "stable",
          riskScoreDelta: 0,
          highRiskAdded: 0,
          highRiskRemoved: 0,
          mostImprovedNodes: [],
          mostDegradedNodes: [],
        },
      });
    }

    // Convert to snapshots
    const snapshots: HistoricalSnapshot[] = analyses.map((a) => {
      const blueprint = a.analysis;
      const nodes = blueprint.nodes || [];

      const highRiskCount = nodes.filter((n: any) => n.risk === "High").length;
      const medRiskCount = nodes.filter((n: any) => n.risk === "Med").length;
      const lowRiskCount = nodes.filter((n: any) => n.risk === "Low").length;

      // Calculate risk score (High=10, Med=5, Low=1)
      const totalRiskPoints =
        highRiskCount * 10 + medRiskCount * 5 + lowRiskCount * 1;
      const maxPossiblePoints = nodes.length * 10;
      const riskScore =
        maxPossiblePoints > 0
          ? Math.round((totalRiskPoints / maxPossiblePoints) * 100)
          : 0;

      return {
        analyzedAt: a.analyzed_at,
        nodes: nodes.map((n: any) => ({
          id: n.id,
          label: n.label,
          risk: n.risk,
          files: n.files || [],
        })),
        totalNodes: nodes.length,
        highRiskCount,
        medRiskCount,
        lowRiskCount,
        riskScore,
      };
    });

    // Calculate trends (compare latest with historical)
    const trends = calculateRiskTrends(snapshots);

    // Calculate summary
    const summary = calculateSummary(snapshots, trends);

    const heatmapData: DebtHeatmapData = {
      repoFullName,
      timeRange: {
        from: snapshots[snapshots.length - 1]?.analyzedAt || "",
        to: snapshots[0]?.analyzedAt || "",
      },
      snapshots,
      trends,
      summary,
    };

    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error("Debt heatmap error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate risk trends for each node across snapshots
 */
function calculateRiskTrends(snapshots: HistoricalSnapshot[]): RiskTrend[] {
  if (snapshots.length === 0) return [];

  const latest = snapshots[0];
  const nodeMap = new Map<string, RiskTrend>();

  // Initialize with latest nodes
  for (const node of latest.nodes) {
    nodeMap.set(node.id, {
      nodeId: node.id,
      nodeLabel: node.label,
      currentRisk: node.risk,
      trend: "new",
      snapshots: [
        {
          date: latest.analyzedAt,
          risk: node.risk,
        },
      ],
    });
  }

  // Build history for each node
  for (let i = 1; i < snapshots.length; i++) {
    const snapshot = snapshots[i];

    for (const node of snapshot.nodes) {
      const trend = nodeMap.get(node.id);

      if (trend) {
        trend.snapshots.push({
          date: snapshot.analyzedAt,
          risk: node.risk,
        });
      }
    }
  }

  // Calculate trend direction
  for (const trend of nodeMap.values()) {
    if (trend.snapshots.length === 1) {
      trend.trend = "new";
      continue;
    }

    const current = trend.snapshots[0];
    const previous = trend.snapshots[1];

    trend.previousRisk = previous.risk;
    trend.changeDate = current.date;

    // Determine trend
    const riskToValue = { High: 3, Med: 2, Low: 1 };
    const currentValue = riskToValue[current.risk];
    const previousValue = riskToValue[previous.risk];

    if (currentValue > previousValue) {
      trend.trend = "increasing";
    } else if (currentValue < previousValue) {
      trend.trend = "decreasing";
    } else {
      // Check for changes in earlier history
      let hasChanged = false;
      for (let i = 1; i < trend.snapshots.length - 1; i++) {
        if (trend.snapshots[i].risk !== current.risk) {
          hasChanged = true;
          break;
        }
      }
      trend.trend = hasChanged ? "stable" : "stable";
    }
  }

  return Array.from(nodeMap.values()).sort((a, b) => {
    // Sort by trend priority: increasing > stable > decreasing > new
    const trendOrder = { increasing: 0, stable: 1, decreasing: 2, new: 3 };
    return trendOrder[a.trend] - trendOrder[b.trend];
  });
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  snapshots: HistoricalSnapshot[],
  trends: RiskTrend[]
): DebtHeatmapData["summary"] {
  if (snapshots.length === 0) {
    return {
      totalScans: 0,
      overallTrend: "stable",
      riskScoreDelta: 0,
      highRiskAdded: 0,
      highRiskRemoved: 0,
      mostImprovedNodes: [],
      mostDegradedNodes: [],
    };
  }

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  // Risk score delta
  const riskScoreDelta = latest.riskScore - oldest.riskScore;

  // Overall trend
  let overallTrend: "improving" | "degrading" | "stable" = "stable";
  if (riskScoreDelta < -5) {
    overallTrend = "improving";
  } else if (riskScoreDelta > 5) {
    overallTrend = "degrading";
  }

  // High risk changes
  const increasingTrends = trends.filter((t) => t.trend === "increasing");
  const decreasingTrends = trends.filter((t) => t.trend === "decreasing");

  const highRiskAdded = increasingTrends.filter(
    (t) => t.currentRisk === "High"
  ).length;
  const highRiskRemoved = decreasingTrends.filter(
    (t) => t.previousRisk === "High" && t.currentRisk !== "High"
  ).length;

  // Most improved/degraded
  const mostImprovedNodes = decreasingTrends
    .filter((t) => t.previousRisk === "High")
    .slice(0, 3)
    .map((t) => t.nodeLabel);

  const mostDegradedNodes = increasingTrends
    .filter((t) => t.currentRisk === "High")
    .slice(0, 3)
    .map((t) => t.nodeLabel);

  return {
    totalScans: snapshots.length,
    overallTrend,
    riskScoreDelta,
    highRiskAdded,
    highRiskRemoved,
    mostImprovedNodes,
    mostDegradedNodes,
  };
}
