/**
 * Documentation Generator API - Creates comprehensive markdown/MDX documentation
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

export const dynamic = "force-dynamic";

interface DocumentationRequest {
  repoFullName: string;
  format?: "markdown" | "mdx";
  forceRegenerate?: boolean;
}

interface DocumentationResult {
  content: string;
  format: string;
  generatedAt: string;
  cached: boolean;
  stats: {
    fileCount: number;
    featureCount: number;
    totalLines: number;
  };
}

/**
 * POST /api/documentation
 * Generates comprehensive documentation from the blueprint
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
    const body: DocumentationRequest = await request.json();
    const { repoFullName, format = "markdown", forceRegenerate } = body;

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [owner, repo] = repoFullName.split("/");

    // Check for cached documentation (unless force regenerate)
    if (!forceRegenerate) {
      const { data: cachedDoc } = await supabase
        .from("generated_documentation")
        .select("*")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .eq("format", format)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (cachedDoc) {
        console.log("Returning cached documentation");
        return NextResponse.json({
          content: cachedDoc.content,
          format: cachedDoc.format,
          generatedAt: cachedDoc.generated_at,
          cached: true,
          stats: {
            fileCount: cachedDoc.file_count,
            featureCount: cachedDoc.feature_count,
            totalLines: cachedDoc.total_lines,
          },
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

    // Generate documentation
    console.log(`Generating ${format} documentation for ${repoFullName}...`);
    const documentation = generateDocumentation(repoFullName, blueprint, format);

    // Calculate stats
    const fileCount = blueprint.nodes.reduce(
      (sum: number, node: any) => sum + (node.files?.length || 0),
      0
    );
    const totalLines = documentation.content.split("\n").length;

    // Cache the result
    const now = new Date().toISOString();
    const { error: cacheError } = await supabase
      .from("generated_documentation")
      .upsert(
        {
          user_id: user.id,
          repo_full_name: repoFullName,
          owner,
          repo,
          format,
          content: documentation.content,
          sections: documentation.sections,
          file_count: fileCount,
          feature_count: blueprint.nodes.length,
          total_lines: totalLines,
          generated_at: now,
          updated_at: now,
        },
        {
          onConflict: "user_id,repo_full_name,format",
        }
      );

    if (cacheError) {
      console.error("Failed to cache documentation:", cacheError);
      // Continue anyway
    } else {
      console.log("Successfully cached documentation");
    }

    return NextResponse.json({
      content: documentation.content,
      format,
      generatedAt: now,
      cached: false,
      stats: {
        fileCount,
        featureCount: blueprint.nodes.length,
        totalLines,
      },
    });
  } catch (error) {
    console.error("Documentation generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generates comprehensive documentation from the blueprint
 */
function generateDocumentation(
  repoFullName: string,
  blueprint: any,
  format: string
): { content: string; sections: any } {
  const [owner, repo] = repoFullName.split("/");
  const timestamp = new Date().toISOString();

  const sections = {
    header: generateHeader(repo, owner, timestamp),
    overview: generateOverview(blueprint),
    architecture: generateArchitecture(blueprint),
    features: generateFeatures(blueprint),
    connections: generateConnections(blueprint),
    fileIndex: generateFileIndex(blueprint),
    gettingStarted: generateGettingStarted(repo),
    footer: generateFooter(),
  };

  const content = Object.values(sections).join("\n\n");

  return { content, sections };
}

function generateHeader(repo: string, owner: string, timestamp: string): string {
  return `# ${repo} - Architecture Documentation

> **Repository**: ${owner}/${repo}  
> **Generated**: ${new Date(timestamp).toLocaleString()}  
> **Generator**: LegacyVibe Blueprint Orchestrator

---`;
}

function generateOverview(blueprint: any): string {
  const totalFiles = blueprint.nodes.reduce(
    (sum: number, node: any) => sum + (node.files?.length || 0),
    0
  );

  return `## 📊 Overview

This repository contains **${blueprint.nodes.length} major features** organized across **${totalFiles} critical files**.

### Quick Stats
- **Features**: ${blueprint.nodes.length}
- **Connections**: ${blueprint.edges.length}
- **Critical Files**: ${totalFiles}

### Risk Assessment
${blueprint.nodes
  .filter((n: any) => n.risk === "High")
  .map((n: any) => `- 🔴 **${n.label}** - High risk`)
  .join("\n") || "- ✅ No high-risk features detected"}

---`;
}

function generateArchitecture(blueprint: any): string {
  return `## 🏗️ Architecture Overview

The system is organized into ${blueprint.nodes.length} interconnected features. Below is a breakdown of the major components:

### Feature Map

\`\`\`
${blueprint.nodes
  .map(
    (node: any, i: number) =>
      `${i + 1}. ${node.label} [${node.risk} Risk]
   └─ ${node.description}`
  )
  .join("\n")}
\`\`\`

### System Flow

The features connect through ${blueprint.edges.length} integration points:

${blueprint.edges
  .slice(0, 10)
  .map((edge: any) => {
    const sourceNode = blueprint.nodes.find((n: any) => n.id === edge.source);
    const targetNode = blueprint.nodes.find((n: any) => n.id === edge.target);
    return `- **${sourceNode?.label || edge.source}** → **${targetNode?.label || edge.target}**  
  _${edge.label}_`;
  })
  .join("\n")}

${blueprint.edges.length > 10 ? `\n_... and ${blueprint.edges.length - 10} more connections_` : ""}

---`;
}

function generateFeatures(blueprint: any): string {
  return `## 🎯 Feature Details

${blueprint.nodes
  .map(
    (node: any) => `### ${node.label}

**Risk Level**: ${getRiskEmoji(node.risk)} ${node.risk}  
**Description**: ${node.description}

${node.vibe ? `**Vibe**: ${getVibeEmoji(node.vibe)} ${node.vibe}` : ""}

#### Critical Files
${node.files?.map((file: string) => `- \`${file}\``).join("\n") || "No files specified"}

${
  node.entryPoints && node.entryPoints.length > 0
    ? `#### Entry Points
${node.entryPoints.map((ep: string) => `- \`${ep}\``).join("\n")}`
    : ""
}

${
  node.conventions && node.conventions.length > 0
    ? `#### Conventions
${node.conventions.map((conv: string) => `- ${conv}`).join("\n")}`
    : ""
}

---`
  )
  .join("\n\n")}`;
}

function generateConnections(blueprint: any): string {
  return `## 🔗 Feature Connections

This section describes how features interact with each other.

${blueprint.edges
  .map((edge: any) => {
    const sourceNode = blueprint.nodes.find((n: any) => n.id === edge.source);
    const targetNode = blueprint.nodes.find((n: any) => n.id === edge.target);
    const type = edge.type || "connection";
    return `### ${sourceNode?.label || edge.source} ➜ ${targetNode?.label || edge.target}

**Type**: ${type}  
**Description**: ${edge.label}

${sourceNode && targetNode ? `
**Source**: ${sourceNode.description}  
**Target**: ${targetNode.description}
` : ""}`;
  })
  .join("\n")}

---`;
}

function generateFileIndex(blueprint: any): string {
  const allFiles = new Set<string>();
  const fileToFeatures = new Map<string, string[]>();

  blueprint.nodes.forEach((node: any) => {
    node.files?.forEach((file: string) => {
      allFiles.add(file);
      if (!fileToFeatures.has(file)) {
        fileToFeatures.set(file, []);
      }
      fileToFeatures.get(file)?.push(node.label);
    });
  });

  const sortedFiles = Array.from(allFiles).sort();

  return `## 📁 File Index

Complete index of all critical files and which features they belong to.

${sortedFiles
  .map((file) => {
    const features = fileToFeatures.get(file) || [];
    return `### \`${file}\`

**Used by**: ${features.join(", ")}`;
  })
  .join("\n\n")}

---`;
}

function generateGettingStarted(repo: string): string {
  return `## 🚀 Getting Started

### For New Developers

1. **Read the Overview** - Understand the system architecture
2. **Study Feature Details** - Pick a feature to explore
3. **Review Connections** - See how features interact
4. **Check File Index** - Find where specific logic lives

### For External Developers

This documentation provides a comprehensive view of ${repo}'s architecture:

- Use the **Feature Details** to understand each component
- Refer to **Connections** to see integration points
- Check **Risk Levels** to understand complexity
- Review **Entry Points** to know where to start coding

### Updating This Documentation

This documentation is auto-generated from the codebase using LegacyVibe's Blueprint Orchestrator.

To regenerate:
1. Re-scan the repository in LegacyVibe
2. Click "Export Docs" to get the latest version
3. The documentation will reflect any architectural changes

---`;
}

function generateFooter(): string {
  return `## 📚 Additional Resources

- [Repository Issues](../issues)
- [Contributing Guide](../CONTRIBUTING.md)
- [API Documentation](../docs/api)

---

_Generated by [LegacyVibe](https://legacyvibe.com) - AI-Powered Codebase Understanding_`;
}

function getRiskEmoji(risk: string): string {
  switch (risk) {
    case "High":
      return "🔴";
    case "Med":
      return "🟡";
    case "Low":
      return "🟢";
    default:
      return "⚪";
  }
}

function getVibeEmoji(vibe: string): string {
  switch (vibe) {
    case "stable":
      return "🔒";
    case "active":
      return "⚡";
    case "fragile":
      return "⚠️";
    case "boilerplate":
      return "📋";
    default:
      return "📦";
  }
}

/**
 * GET /api/documentation
 * Retrieves cached documentation for a repository
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
    const format = searchParams.get("format") || "markdown";

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Missing repo parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("generated_documentation")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_full_name", repoFullName)
      .eq("format", format)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ cached: false });
    }

    return NextResponse.json({
      content: data.content,
      format: data.format,
      generatedAt: data.generated_at,
      cached: true,
      stats: {
        fileCount: data.file_count,
        featureCount: data.feature_count,
        totalLines: data.total_lines,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve documentation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
