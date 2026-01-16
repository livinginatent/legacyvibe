/**
 * Technical Debt Audit API
 * One-time, repo-wide technical debt analysis using the existing blueprint.
 *
 * Design:
 * - Per user + repo, only one audit is ever run.
 * - If an audit exists, we always return the cached result.
 * - Leverages the latest blueprint (business-logic graph) and the analyses history
 *   to infer hotspots, smells, and priorities.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

interface DebtFinding {
  id: string;
  title: string;
  description: string;
  category:
    | "architecture"
    | "code-quality"
    | "testing"
    | "tooling"
    | "documentation"
    | "process"
    | "performance";
  severity: "critical" | "high" | "medium" | "low";
  effort: "quick-win" | "moderate" | "major";
  evidence: string[];
  impactedFeatures: string[];
  recommendedActions: string[];
}

interface DebtHotspot {
  featureId: string;
  featureLabel: string;
  risk: "High" | "Med" | "Low";
  files: string[];
  reasons: string[];
}

interface DebtSummary {
  repoFullName: string;
  analyzedAt: string;
  overallScore: number; // 0–100 (100 = very healthy, 0 = extremely unhealthy)
  grade: "A" | "B" | "C" | "D" | "F";
  narrative: string;
  categories: {
    architecture: number;
    codeQuality: number;
    testing: number;
    tooling: number;
    documentation: number;
    process: number;
    performance: number;
  };
  hotspots: DebtHotspot[];
  findings: DebtFinding[];
  constraints: {
    perRepoLimit: 1;
    alreadyAnalyzed: boolean;
  };
}

/**
 * GET /api/debt-heatmap
 * Returns a one-time technical debt audit for a repository.
 *
 * Behavior:
 * - If an audit already exists for this user+repo, returns it.
 * - Otherwise, derives an audit from the latest blueprint and analysis history,
 *   stores it, and returns it.
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

    // 1) If an audit already exists, always return it (one-time per repo).
    const { data: existingAudit, error: auditError } = await supabase
      .from("debt_audits")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (auditError && auditError.code !== "PGRST116") {
      console.error("Failed to read existing debt audit:", auditError);
      return NextResponse.json(
        { error: "Failed to read technical debt audit" },
        { status: 500 }
      );
    }

    if (existingAudit) {
      const payload: DebtSummary = {
        ...(existingAudit.summary as DebtSummary),
        constraints: {
          perRepoLimit: 1,
          alreadyAnalyzed: true,
        },
      };

      return NextResponse.json(payload);
    }

    // 2) No audit yet: derive from latest blueprint and analysis history.
    // Latest blueprint (business-logic graph)
    const { data: latestAnalysis, error: latestError } = await supabase
      .from("analyses")
      .select("analysis, analyzed_at")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    if (latestError || !latestAnalysis) {
      return NextResponse.json(
        {
          error:
            "No blueprint found for this repository. Run a full analysis first.",
        },
        { status: 404 }
      );
    }

    const blueprint = latestAnalysis.analysis;
    const analyzedAt = latestAnalysis.analyzed_at;
    const nodes = Array.isArray(blueprint?.nodes) ? blueprint.nodes : [];
    const edges = Array.isArray(blueprint?.edges) ? blueprint.edges : [];

    // Historical scans (for identifying hotspots that change a lot)
    const { data: history, error: historyError } = await supabase
      .from("analyses")
      .select("analysis, analyzed_at")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .order("analyzed_at", { ascending: false })
      .limit(10);

    if (historyError) {
      console.error("Failed to read analysis history for debt audit:", historyError);
    }

    // --- Heuristic scoring based on your description ---
    // We approximate:
    // - Hotspots: features with High risk or many incoming edges.
    // - Architecture: god nodes (high degree), tightly coupled modules.
    // - Testing: inferred from lack of obvious test-related files in blueprint.
    // - Documentation: inferred from presence/absence of docs-related features.
    // - Process: inferred from multiple blueprint scans with many High-risk nodes.

    const nodeById = new Map<string, any>();
    for (const n of nodes) {
      if (n?.id) nodeById.set(n.id, n);
    }

    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();
    for (const e of edges) {
      if (!e?.source || !e?.target) continue;
      incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
      outgoingCount.set(e.source, (outgoingCount.get(e.source) || 0) + 1);
    }

    const hotspots: DebtHotspot[] = [];
    for (const n of nodes) {
      const inDeg = incomingCount.get(n.id) || 0;
      const outDeg = outgoingCount.get(n.id) || 0;
      const connections = inDeg + outDeg;

      const reasons: string[] = [];
      if (n.risk === "High") {
        reasons.push("Marked as High risk in blueprint.");
      }
      if (connections >= 3) {
        reasons.push(
          `Heavily connected feature (${connections} incoming/outgoing relationships) – potential god object or central choke point.`
        );
      }

      if (reasons.length > 0) {
        hotspots.push({
          featureId: n.id,
          featureLabel: n.label,
          risk: n.risk,
          files: n.files || [],
          reasons,
        });
      }
    }

    // Basic category scores (0–100, higher = healthier)
    const totalNodes = nodes.length || 1;
    const highRiskCount = nodes.filter((n: any) => n.risk === "High").length;
    const medRiskCount = nodes.filter((n: any) => n.risk === "Med").length;

    const riskPenalty =
      highRiskCount * 10 + medRiskCount * 5; // simple risk-based penalty

    const architectureScore = Math.max(
      0,
      100 - Math.min(60, hotspots.length * 8 + riskPenalty / 2)
    );

    const hasTestLikeFiles = nodes.some((n: any) =>
      (n.files || []).some((f: string) =>
        f.toLowerCase().match(/test|spec|__tests__|testing/)
      )
    );
    const testingScore = hasTestLikeFiles ? 75 : 40;

    const hasDocsLikeFiles = nodes.some((n: any) =>
      (n.files || []).some((f: string) =>
        f.toLowerCase().match(/readme|docs|documentation|guide/)
      )
    );
    const documentationScore = hasDocsLikeFiles ? 80 : 50;

    const scansCount = history?.length || 1;
    const processScore = scansCount >= 3 ? 75 : 55;

    // Tooling & performance – placeholders, since we don't actually run linters/scanners here.
    const toolingScore = 65;
    const performanceScore = 65;

    const codeQualityScore = Math.max(
      0,
      100 - Math.min(50, riskPenalty)
    );

    // Overall score = average of category scores
    const overallScoreRaw =
      (architectureScore +
        codeQualityScore +
        testingScore +
        toolingScore +
        documentationScore +
        processScore +
        performanceScore) /
      7;
    const overallScore = Math.round(overallScoreRaw);

    const grade: DebtSummary["grade"] =
      overallScore >= 90
        ? "A"
        : overallScore >= 75
        ? "B"
        : overallScore >= 60
        ? "C"
        : overallScore >= 45
        ? "D"
        : "F";

    const findings: DebtFinding[] = [];

    if (hotspots.length > 0) {
      findings.push({
        id: "hotspot-features",
        title: "High-risk, highly connected feature hotspots",
        description:
          "Several features act as both critical risk centers and central integration points. Changes here are likely to have wide blast radius and should be refactored with tests and clear seams.",
        category: "architecture",
        severity: highRiskCount > 0 ? "high" : "medium",
        effort: "major",
        evidence: hotspots.slice(0, 5).map((h) => {
          return `${h.featureLabel} (risk: ${h.risk}, files: ${
            (h.files || []).slice(0, 3).join(", ") || "n/a"
          })`;
        }),
        impactedFeatures: hotspots.map((h) => h.featureLabel),
        recommendedActions: [
          "Identify the top 1–2 hotspot features and map their direct and indirect dependencies before any refactor.",
          "Split god objects into smaller, focused modules with clear responsibilities.",
          "Introduce anti-corruption layers or facades around central services so callers don't know about low-level details.",
        ],
      });
    }

    if (!hasTestLikeFiles) {
      findings.push({
        id: "missing-tests",
        title: "Limited or no observable test surface in blueprint",
        description:
          "The analysis did not find obvious test files or test-focused features, which suggests refactors will be riskier and slower.",
        category: "testing",
        severity: "high",
        effort: "moderate",
        evidence: [
          "No test-related files (e.g., *test.ts, __tests__) appeared in the blueprint graph.",
        ],
        impactedFeatures: nodes.slice(0, 5).map((n: any) => n.label),
        recommendedActions: [
          "Identify the top 3–5 critical user flows and add high-level tests first (smoke / happy path).",
          "Introduce tests around the highest-risk hotspots before any deep refactor.",
        ],
      });
    }

    if (!hasDocsLikeFiles) {
      findings.push({
        id: "docs-debt",
        title: "Documentation and knowledge debt",
        description:
          "The repo appears to lack dedicated documentation surfaces in the core blueprint, which makes onboarding and refactoring slower.",
        category: "documentation",
        severity: "medium",
        effort: "quick-win",
        evidence: [
          "No clear docs-related files or features were detected in the main blueprint.",
        ],
        impactedFeatures: nodes.slice(0, 5).map((n: any) => n.label),
        recommendedActions: [
          "Create or update a high-level architecture README for the main subsystems.",
          "Document at least the top 3 hotspots: what they own, what depends on them, and how to change them safely.",
        ],
      });
    }

    const narrativeParts: string[] = [];
    narrativeParts.push(
      `This technical debt audit reflects the current blueprint for ${repoFullName} as of ${new Date(
        analyzedAt
      ).toLocaleString()}.`
    );
    narrativeParts.push(
      `Overall health is graded ${grade} with an estimated score of ${overallScore}/100.`
    );

    // Call out specific hotspot features by name
    if (hotspots.length > 0) {
      const hotspotNames = hotspots
        .slice(0, 3)
        .map((h) => h.featureLabel)
        .join(", ");
      narrativeParts.push(
        `${hotspots.length} feature-level hotspots concentrate a lot of risk and coupling, including: ${hotspotNames}.`
      );
    }

    // Explain main scoring drivers so the number is not opaque
    const scoreDrivers: string[] = [];
    if (highRiskCount > 0) {
      scoreDrivers.push(
        `${highRiskCount} High-risk feature${highRiskCount > 1 ? "s" : ""}`
      );
    }
    if (medRiskCount > 0) {
      scoreDrivers.push(
        `${medRiskCount} Medium-risk feature${medRiskCount > 1 ? "s" : ""}`
      );
    }
    if (hotspots.length > 0) {
      scoreDrivers.push(
        `${hotspots.length} heavily connected hotspot${hotspots.length > 1 ? "s" : ""}`
      );
    }
    if (!hasTestLikeFiles) {
      scoreDrivers.push("limited or no detectable tests around core flows");
    }
    if (!hasDocsLikeFiles) {
      scoreDrivers.push("thin architecture / feature documentation");
    }
    if (scoreDrivers.length > 0) {
      narrativeParts.push(
        `The score is mainly pulled down by ${scoreDrivers.join(
          ", "
        )}. Improving these areas will have the biggest impact on the grade.`
      );
    }

    const summary: DebtSummary = {
      repoFullName,
      analyzedAt,
      overallScore,
      grade,
      narrative: narrativeParts.join(" "),
      categories: {
        architecture: Math.round(architectureScore),
        codeQuality: Math.round(codeQualityScore),
        testing: Math.round(testingScore),
        tooling: Math.round(toolingScore),
        documentation: Math.round(documentationScore),
        process: Math.round(processScore),
        performance: Math.round(performanceScore),
      },
      hotspots,
      findings,
      constraints: {
        perRepoLimit: 1,
        alreadyAnalyzed: false,
      },
    };

    // 3) Persist audit so it can only be run once per repo.
    const { error: insertError } = await supabase.from("debt_audits").upsert(
      {
        user_id: user.id,
        repo_full_name: repoFullName,
        summary,
        analyzed_at: analyzedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,repo_full_name",
      }
    );

    if (insertError) {
      console.error("Failed to persist technical debt audit:", insertError);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Technical debt audit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
