/**
 * Blueprint Orchestrator - Extracts business logic structure from repositories
 */

import { App } from "octokit";

export interface FileNode {
  path: string;
  type: "file" | "dir";
  size?: number;
}

export interface ManifestContent {
  path: string;
  content: string;
}

/**
 * Initializes the GitHub App instance
 */
function getGitHubApp(): App {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error(
      "GitHub App credentials not configured. Set GITHUB_APP_ID and GITHUB_PRIVATE_KEY environment variables."
    );
  }

  return new App({
    appId,
    privateKey,
  });
}

/**
 * Fetches the complete file tree from a GitHub repository
 */
export async function fetchFileTree(
  owner: string,
  repo: string,
  installationId: string
): Promise<FileNode[]> {
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(parseInt(installationId));

  try {
    // Get the default branch
    const { data: repoData } = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo,
      }
    );

    const defaultBranch = repoData.default_branch;

    // Get the tree recursively
    const { data: treeData } = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: "true",
      }
    );

    // Filter and map the tree
    const fileTree: FileNode[] = treeData.tree
      .filter((item: any) => item.type === "blob" || item.type === "tree")
      .map((item: any) => ({
        path: item.path,
        type: item.type === "blob" ? "file" : "dir",
        size: item.size,
      }))
      .filter((item: FileNode) => {
        // Exclude common non-essential directories
        const excludeDirs = [
          "node_modules",
          ".git",
          "dist",
          "build",
          ".next",
          "out",
          "coverage",
          "__pycache__",
          ".venv",
          "venv",
        ];
        return !excludeDirs.some((dir) => item.path.includes(dir));
      });

    return fileTree;
  } catch (error) {
    console.error("Failed to fetch file tree:", error);
    throw new Error(
      `Failed to fetch file tree: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetches manifest files from the repository
 */
export async function fetchManifests(
  owner: string,
  repo: string,
  installationId: string
): Promise<ManifestContent[]> {
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(parseInt(installationId));

  // Common manifest file patterns
  const manifestPatterns = [
    "package.json",
    "package-lock.json",
    "composer.json",
    "Gemfile",
    "requirements.txt",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "pyproject.toml",
    "pubspec.yaml",
  ];

  const manifests: ManifestContent[] = [];

  for (const pattern of manifestPatterns) {
    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: pattern,
        }
      );

      if ("content" in data && data.content) {
        // Decode base64 content
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        manifests.push({
          path: pattern,
          content,
        });
      }
    } catch (error) {
      // File doesn't exist, skip it
      continue;
    }
  }

  return manifests;
}

/**
 * Filters file tree to only include important files for analysis
 */
function filterImportantFiles(fileTree: FileNode[]): FileNode[] {
  // Important file patterns
  const importantPatterns = [
    // Code files (but not test files)
    /\.(tsx?|jsx?|py|java|go|rs|rb|php|cs|swift|kt)$/,
    // Config files
    /^(next|vite|webpack|rollup|babel|tsconfig|jest|vitest|playwright)\.config\./,
    // Entry points
    /^(index|main|app|server|client)\.(tsx?|jsx?|py)$/,
    // API routes
    /\/(api|routes|controllers|handlers)\//,
    // Components/UI
    /\/(components|ui|views|pages|screens)\//,
    // Models/Schema
    /\/(models|schema|entities|types)\//,
    // Services/Utils
    /\/(services|utils|lib|helpers)\//,
  ];

  // Exclude patterns
  const excludePatterns = [
    // Test files
    /\.(test|spec)\.(tsx?|jsx?|py)$/,
    /__tests__\//,
    /\.test\//,
    // Style files (we don't need them for business logic)
    /\.(css|scss|sass|less|styl)$/,
    // Images and assets
    /\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|mp3)$/,
    // Documentation
    /\.(md|txt)$/,
    // Lock files
    /(package-lock|yarn\.lock|poetry\.lock|Gemfile\.lock)/,
    // Generated/compiled files
    /\/(dist|build|out|target|bin)\//,
  ];

  return fileTree.filter((node) => {
    if (node.type === "dir") return false;

    // Check exclusions first
    if (excludePatterns.some((pattern) => pattern.test(node.path))) {
      return false;
    }

    // Check if it matches important patterns
    return importantPatterns.some((pattern) => pattern.test(node.path));
  });
}

/**
 * Converts file tree to a condensed string representation for AI analysis
 * Limits output to most important files to stay within token limits
 */
export function formatFileTreeForAI(fileTree: FileNode[]): string {
  // Filter to important files only
  const importantFiles = filterImportantFiles(fileTree);

  // Further limit if still too many files
  const maxFiles = 500; // Limit to ~500 most important files
  const limitedFiles = importantFiles.slice(0, maxFiles);

  // Group by top-level directory only (not full path)
  const dirMap = new Map<string, string[]>();

  for (const node of limitedFiles) {
    const topLevelDir = node.path.includes("/")
      ? node.path.substring(0, node.path.indexOf("/"))
      : ".";

    if (!dirMap.has(topLevelDir)) {
      dirMap.set(topLevelDir, []);
    }
    dirMap.get(topLevelDir)!.push(node.path);
  }

  // Format as condensed structure
  let output = `FILE TREE (${limitedFiles.length} key files shown):\n`;
  const sortedDirs = Array.from(dirMap.keys()).sort();

  for (const dir of sortedDirs) {
    const files = dirMap.get(dir)!.sort();
    output += `\n${dir}/ (${files.length} files)\n`;
    
    // Show up to 20 files per directory
    const filesToShow = files.slice(0, 20);
    for (const file of filesToShow) {
      // Show relative path from top-level dir
      const displayPath = dir === "." ? file : file;
      output += `  ${displayPath}\n`;
    }
    
    if (files.length > 20) {
      output += `  ... and ${files.length - 20} more files\n`;
    }
  }

  if (importantFiles.length > maxFiles) {
    output += `\n(${importantFiles.length - maxFiles} additional files not shown)\n`;
  }

  return output;
}

/**
 * Formats manifests for AI analysis (with truncation for large files)
 */
export function formatManifestsForAI(manifests: ManifestContent[]): string {
  let output = "\nMANIFEST FILES:\n";

  for (const manifest of manifests) {
    output += `\n=== ${manifest.path} ===\n`;
    
    // Truncate very large manifests
    const maxLength = 5000; // ~5000 chars per manifest
    if (manifest.content.length > maxLength) {
      // For package.json, extract just dependencies
      if (manifest.path === "package.json") {
        try {
          const parsed = JSON.parse(manifest.content);
          const condensed = {
            name: parsed.name,
            version: parsed.version,
            dependencies: parsed.dependencies || {},
            devDependencies: parsed.devDependencies
              ? Object.keys(parsed.devDependencies).slice(0, 20)
              : [],
            scripts: parsed.scripts
              ? Object.keys(parsed.scripts).slice(0, 10)
              : [],
          };
          output += JSON.stringify(condensed, null, 2);
        } catch {
          output += manifest.content.substring(0, maxLength) + "\n... (truncated)";
        }
      } else {
        output += manifest.content.substring(0, maxLength) + "\n... (truncated)";
      }
    } else {
      output += manifest.content;
    }
    output += "\n";
  }

  return output;
}
