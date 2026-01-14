/* eslint-disable @typescript-eslint/no-explicit-any */
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
      .map(
        (item: any): FileNode => ({
          path: item.path,
          type: (item.type === "blob" ? "file" : "dir") as "file" | "dir",
          size: item.size,
        })
      )
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
    output += `\n(${
      importantFiles.length - maxFiles
    } additional files not shown)\n`;
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
          output +=
            manifest.content.substring(0, maxLength) + "\n... (truncated)";
        }
      } else {
        output +=
          manifest.content.substring(0, maxLength) + "\n... (truncated)";
      }
    } else {
      output += manifest.content;
    }
    output += "\n";
  }

  return output;
}

/**
 * Repository Chunk - represents a logical section of the codebase
 */
export interface RepositoryChunk {
  id: string;
  name: string;
  description: string;
  files: FileNode[];
  estimatedTokens: number;
}

/**
 * Intelligently divides repository into logical chunks for comprehensive analysis
 * Uses directory structure, file patterns, and size to create meaningful chunks
 */
export function createRepositoryChunks(
  fileTree: FileNode[],
  maxTokensPerChunk: number = 150000 // ~150K tokens per chunk
): RepositoryChunk[] {
  const chunks: RepositoryChunk[] = [];

  // Get only important files for analysis
  const importantFiles = filterImportantFiles(fileTree);

  // Group files by top-level directory
  const dirGroups = new Map<string, FileNode[]>();
  const rootFiles: FileNode[] = [];

  for (const file of importantFiles) {
    if (!file.path.includes("/")) {
      rootFiles.push(file);
      continue;
    }

    const topDir = file.path.substring(0, file.path.indexOf("/"));
    if (!dirGroups.has(topDir)) {
      dirGroups.set(topDir, []);
    }
    dirGroups.get(topDir)!.push(file);
  }

  // Estimate tokens for a file (rough: 1 token ~= 4 chars, avg file ~500 lines ~15KB)
  const estimateFileTokens = (file: FileNode): number => {
    const avgFileSize = 15000; // 15KB average
    const size = file.size || avgFileSize;
    return Math.ceil(size / 4);
  };

  // Add root files as first chunk if any
  if (rootFiles.length > 0) {
    chunks.push({
      id: "root",
      name: "Root Configuration",
      description: "Root-level configuration and entry files",
      files: rootFiles,
      estimatedTokens: rootFiles.reduce(
        (sum, f) => sum + estimateFileTokens(f),
        0
      ),
    });
  }

  // Process each directory group
  const sortedDirs = Array.from(dirGroups.keys()).sort();

  for (const dir of sortedDirs) {
    const files = dirGroups.get(dir)!;
    const totalTokens = files.reduce(
      (sum, f) => sum + estimateFileTokens(f),
      0
    );

    // Determine chunk strategy based on directory name and size
    const chunkName = getChunkName(dir);
    const chunkDesc = getChunkDescription(dir, files);

    // If directory is small enough, make it a single chunk
    if (totalTokens <= maxTokensPerChunk) {
      chunks.push({
        id: dir,
        name: chunkName,
        description: chunkDesc,
        files: files,
        estimatedTokens: totalTokens,
      });
    } else {
      // Directory is too large, split by subdirectories
      const subDirGroups = new Map<string, FileNode[]>();

      for (const file of files) {
        const parts = file.path.split("/");
        if (parts.length <= 2) {
          // Direct children of this directory
          const subKey = `${dir}/root`;
          if (!subDirGroups.has(subKey)) {
            subDirGroups.set(subKey, []);
          }
          subDirGroups.get(subKey)!.push(file);
        } else {
          // Group by second-level directory
          const subDir = parts.slice(0, 2).join("/");
          if (!subDirGroups.has(subDir)) {
            subDirGroups.set(subDir, []);
          }
          subDirGroups.get(subDir)!.push(file);
        }
      }

      // Create chunks for subdirectories
      for (const [subDir, subFiles] of subDirGroups.entries()) {
        const subTokens = subFiles.reduce(
          (sum, f) => sum + estimateFileTokens(f),
          0
        );
        chunks.push({
          id: subDir,
          name: `${chunkName} / ${getSubChunkName(subDir)}`,
          description: `${chunkDesc} - ${getSubChunkName(subDir)} module`,
          files: subFiles,
          estimatedTokens: subTokens,
        });
      }
    }
  }

  return chunks;
}

/**
 * Get human-readable name for a chunk based on directory
 */
function getChunkName(dir: string): string {
  const nameMap: Record<string, string> = {
    api: "API Layer",
    app: "Application Core",
    src: "Source Code",
    lib: "Libraries",
    components: "UI Components",
    pages: "Pages & Routes",
    services: "Business Services",
    models: "Data Models",
    utils: "Utilities",
    helpers: "Helper Functions",
    middleware: "Middleware",
    hooks: "React Hooks",
    context: "Context Providers",
    store: "State Management",
    config: "Configuration",
    types: "Type Definitions",
    interfaces: "Interfaces",
    controllers: "Controllers",
    routes: "Route Handlers",
    views: "Views",
    templates: "Templates",
    auth: "Authentication",
    database: "Database",
    db: "Database",
  };

  return (
    nameMap[dir.toLowerCase()] || dir.charAt(0).toUpperCase() + dir.slice(1)
  );
}

/**
 * Get description for a chunk
 */
function getChunkDescription(dir: string, files: FileNode[]): string {
  const descMap: Record<string, string> = {
    api: "API endpoints and route handlers",
    app: "Main application logic and structure",
    src: "Core source code and business logic",
    lib: "Shared libraries and utilities",
    components: "Reusable UI components",
    pages: "Page components and routing",
    services: "Business logic and external service integrations",
    models: "Data models and schemas",
    utils: "Utility functions and helpers",
    middleware: "Request/response middleware",
    hooks: "Custom React hooks",
    context: "React context and global state",
    store: "State management (Redux/Zustand/etc)",
    config: "Configuration files and constants",
    auth: "Authentication and authorization logic",
    database: "Database schemas and migrations",
  };

  return descMap[dir.toLowerCase()] || `${files.length} files in ${dir}`;
}

/**
 * Get name for a sub-chunk
 */
function getSubChunkName(subDir: string): string {
  const parts = subDir.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

/**
 * Format a chunk for AI analysis
 */
export function formatChunkForAI(chunk: RepositoryChunk): string {
  let output = `CHUNK: ${chunk.name}\n`;
  output += `DESCRIPTION: ${chunk.description}\n`;
  output += `FILES (${chunk.files.length} total):\n\n`;

  // Group files by immediate parent directory for better structure
  const grouped = new Map<string, string[]>();

  for (const file of chunk.files) {
    const dir = file.path.includes("/")
      ? file.path.substring(0, file.path.lastIndexOf("/"))
      : ".";

    if (!grouped.has(dir)) {
      grouped.set(dir, []);
    }
    grouped.get(dir)!.push(file.path);
  }

  // Output grouped structure
  const sortedDirs = Array.from(grouped.keys()).sort();
  for (const dir of sortedDirs) {
    const files = grouped.get(dir)!.sort();
    output += `${dir}/\n`;
    for (const file of files) {
      output += `  ${file}\n`;
    }
    output += "\n";
  }

  return output;
}

/**
 * Fetch file contents for a specific set of files
 * Used for deep analysis of critical files
 */
export async function fetchFileContents(
  owner: string,
  repo: string,
  installationId: string,
  filePaths: string[],
  maxFileSizeKB: number = 100 // Skip files larger than 100KB
): Promise<Map<string, string>> {
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(parseInt(installationId));
  const contents = new Map<string, string>();

  // Limit to first 50 files to avoid rate limits
  const limitedPaths = filePaths.slice(0, 50);

  for (const path of limitedPaths) {
    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path,
        }
      );

      if ("content" in data && data.content) {
        // Check file size
        const sizeKB = data.size / 1024;
        if (sizeKB > maxFileSizeKB) {
          console.log(`Skipping large file: ${path} (${sizeKB.toFixed(2)}KB)`);
          continue;
        }

        // Decode base64 content
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        contents.set(path, content);
      }
    } catch (error) {
      console.warn(`Failed to fetch ${path}:`, error);
      // Continue with other files
    }
  }

  return contents;
}
