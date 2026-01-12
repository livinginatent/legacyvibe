import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { GithubScanner } from "@/services/gitHubScanner";

interface AnalysisResponse {
  techStack: {
    languages: string[];
    frameworks: string[];
    libraries: string[];
  };
  featureClusters: Array<{
    name: string;
    description: string;
    files: string[];
    keyFiles: string[];
    dependencies?: string[];
  }>;
  architecture?: {
    pattern: string;
    description: string;
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    const { owner, repo, installationId, forceRescan = false } = body;
    const repoFullName = `${owner}/${repo}`;

    // Validate input
    if (!owner || !repo) {
      console.error("Missing owner or repo:", { owner, repo });
      return new Response(
        JSON.stringify({ error: "Owner and repo are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!installationId) {
      console.error("Missing installationId");
      return new Response(
        JSON.stringify({
          error:
            "GitHub App not connected. Please connect your GitHub account.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase and get user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for cached analysis (unless force rescan)
    if (!forceRescan) {
      console.log(`Checking for cached analysis of ${repoFullName}...`);
      const { data: cachedAnalysis, error: cacheError } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .eq("repo_full_name", repoFullName)
        .single();

      if (cachedAnalysis && !cacheError) {
        console.log(`Found cached analysis from ${cachedAnalysis.analyzed_at}`);
        return new Response(
          JSON.stringify({
            ...cachedAnalysis.analysis,
            cached: true,
            analyzedAt: cachedAnalysis.analyzed_at,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(
      `Starting fresh scan for ${owner}/${repo} with installation ${installationId}`
    );

    // Verify API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch the code structure from GitHub
    console.log(`Scanning repository: ${owner}/${repo}`);
    const scanner = new GithubScanner(Number(installationId));
    const { tree, manifests } = await scanner.scanRepository(owner, repo);

    console.log(
      `Found ${tree.length} files and ${
        Object.keys(manifests).length
      } manifest files`
    );

    // 2. Ask Claude to analyze the codebase
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      temperature: 0.7,
      system: `You are the LegacyVibe Architect - an AI that extracts deep insights from codebases and explains them to non-technical founders in plain English.

Your job is to analyze a repository's file structure and manifest files, then return a comprehensive JSON object with:

1. **techStack**: Identify ALL primary languages, frameworks, and libraries used (be thorough)
2. **featureClusters**: Group related files into feature clusters with creative "The [Name] Vibe" naming
3. **architecture**: Identify the overall architecture pattern

Rules for Feature Clusters:
- Use creative, founder-friendly names like "The Payment Vibe", "The AI Processing Vibe", "The User Auth Vibe"
- Provide detailed explanations (3-4 sentences) about what the feature does and its business value
- Include SPECIFIC file paths in "files" array (e.g., "app/auth/login/page.tsx", "lib/stripe-utils.ts")
- Include 3-5 KEY FILES in "keyFiles" array - the most important files that define this feature
- List relevant dependencies in "dependencies" array if applicable (e.g., ["stripe", "next-auth"])
- Identify 5-10 main feature clusters (be comprehensive but organized)
- Group by business function, not just folder structure

Rules for Tech Stack:
- List ALL languages found (TypeScript, JavaScript, Python, etc.)
- List ALL major frameworks (Next.js, React, Express, etc.)
- List ALL notable libraries from manifests (Stripe, OpenAI, Prisma, etc.) - be thorough

Architecture Pattern:
- Identify the pattern (e.g., "Monolithic Full-Stack", "Microservices", "JAMstack", "Serverless")
- Provide 2-3 sentence description of the architecture approach

Return ONLY valid JSON in this exact format:
{
  "techStack": {
    "languages": ["TypeScript", "JavaScript", "Python"],
    "frameworks": ["Next.js 14", "React", "FastAPI"],
    "libraries": ["Stripe", "OpenAI SDK", "Tailwind CSS", "Prisma", "NextAuth", "Zod"]
  },
  "architecture": {
    "pattern": "Full-Stack Monolithic with Edge Functions",
    "description": "Modern Next.js application using server components and API routes. Backend and frontend coexist in a single codebase with clear separation of concerns. Uses edge runtime for performance-critical operations."
  },
  "featureClusters": [
    {
      "name": "The Authentication Vibe",
      "description": "Comprehensive user authentication system handling sign-ups, logins, password resets, and session management. Implements secure token-based authentication with email verification. Integrates OAuth providers for social login options. Critical for user account security and access control.",
      "files": ["app/auth/login/page.tsx", "app/auth/register/page.tsx", "app/auth/forgot-password/page.tsx", "lib/auth-utils.ts", "middleware.ts"],
      "keyFiles": ["app/auth/actions.ts", "lib/auth-utils.ts", "middleware.ts"],
      "dependencies": ["next-auth", "bcrypt", "jsonwebtoken"]
    }
  ]
}`,
      prompt: `Analyze this repository in detail:

**Repository**: ${owner}/${repo}

**File Structure** (${tree.length} files):
${tree.slice(0, 300).join("\n")}
${tree.length > 300 ? `\n... and ${tree.length - 300} more files` : ""}

**Manifest Files**:
${Object.entries(manifests)
  .map(
    ([path, content]) =>
      `\n--- ${path} ---\n${content.slice(0, 2000)}${
        content.length > 2000 ? "\n...(truncated)" : ""
      }`
  )
  .join("\n")}

Provide a comprehensive analysis with:
1. Complete tech stack inventory (all languages, frameworks, and libraries)
2. 5-10 feature clusters with SPECIFIC file paths (not just folder names)
3. Key files for each feature (the 3-5 most important files)
4. Business-focused descriptions (what it does, why it matters)
5. Architecture pattern identification

Return ONLY the JSON structure described in the system prompt. Be thorough and specific with file paths.`,
    });

    console.log("Claude analysis complete");

    // 3. Parse and validate Claude's response
    let analysis: AnalysisResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      analysis = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!analysis.techStack || !analysis.featureClusters) {
        throw new Error("Invalid response structure");
      }

      // Ensure keyFiles exists for each feature cluster
      analysis.featureClusters = analysis.featureClusters.map((cluster) => ({
        ...cluster,
        keyFiles: cluster.keyFiles || cluster.files.slice(0, 3),
        dependencies: cluster.dependencies || [],
      }));
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      console.error("Raw response:", text);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Save to Supabase for caching
    console.log(`Saving analysis to database...`);
    const { error: saveError } = await supabase.from("analyses").upsert(
      {
        user_id: user.id,
        repo_full_name: repoFullName,
        owner,
        repo,
        analysis,
        analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,repo_full_name",
      }
    );

    if (saveError) {
      console.error("Failed to save analysis:", saveError);
      // Don't fail the request, just log the error
    } else {
      console.log("Analysis saved successfully");
    }

    // 5. Return the structured analysis
    return new Response(
      JSON.stringify({
        ...analysis,
        cached: false,
        analyzedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Analysis error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Analysis failed";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
