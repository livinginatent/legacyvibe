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
  }>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    const { owner, repo, installationId } = body;

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

    console.log(
      `Starting scan for ${owner}/${repo} with installation ${installationId}`
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
      system: `You are the LegacyVibe Architect - an AI that explains codebases to non-technical founders in plain English.

Your job is to analyze a repository's file structure and manifest files, then return a JSON object with:

1. **techStack**: Identify the primary languages, frameworks, and libraries used
2. **featureClusters**: Group related files into feature clusters with creative "The [Name] Vibe" naming

Rules:
- Use creative, founder-friendly names like "The Payment Vibe", "The AI Processing Vibe", "The User Auth Vibe"
- Explain what each feature does in simple, non-technical language
- Focus on the business value and purpose, not implementation details
- Be concise but informative (2-3 sentences per feature)
- Identify 4-8 main feature clusters (don't overwhelm)

Return ONLY valid JSON in this exact format:
{
  "techStack": {
    "languages": ["JavaScript", "Python"],
    "frameworks": ["Next.js", "FastAPI"],
    "libraries": ["Stripe", "OpenAI", "Tailwind CSS"]
  },
  "featureClusters": [
    {
      "name": "The Authentication Vibe",
      "description": "Handles user sign-ups, logins, and password resets. Makes sure only the right people can access their accounts.",
      "files": ["auth/", "login/"]
    }
  ]
}`,
      prompt: `Analyze this repository:

**Repository**: ${owner}/${repo}

**File Structure** (${tree.length} files):
${tree.slice(0, 200).join("\n")}
${tree.length > 200 ? `\n... and ${tree.length - 200} more files` : ""}

**Manifest Files**:
${Object.entries(manifests)
  .map(
    ([path, content]) =>
      `\n--- ${path} ---\n${content.slice(0, 1000)}${
        content.length > 1000 ? "\n...(truncated)" : ""
      }`
  )
  .join("\n")}

Analyze this codebase and return the JSON structure described in the system prompt.`,
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

    // 4. (Optional) Save to Supabase for caching
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Could save to a 'analyses' table for instant retrieval next time
      // await supabase.from('analyses').upsert({
      //   user_id: user.id,
      //   repo_full_name: `${owner}/${repo}`,
      //   analysis,
      //   analyzed_at: new Date().toISOString()
      // });
    }

    // 5. Return the structured analysis
    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
