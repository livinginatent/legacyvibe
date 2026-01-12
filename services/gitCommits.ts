/**
 * Git Commits Service
 * Fetches commit history from GitHub repositories
 */

import { App } from "octokit";

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  files: CommitFile[];
}

export interface CommitFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
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
 * Fetches recent commits from a repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param installationId - GitHub App installation ID
 * @param options - Fetch options (limit, since date, etc.)
 */
export async function getRecentCommits(
  owner: string,
  repo: string,
  installationId: string,
  options: {
    limit?: number;
    since?: string; // ISO date string
    until?: string; // ISO date string
    path?: string; // Filter by file path
  } = {}
): Promise<GitCommit[]> {
  try {
    const app = getGitHubApp();
    const octokit = await app.getInstallationOctokit(parseInt(installationId));

    // Fetch commits
    const { data: commits } = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner,
        repo,
        per_page: options.limit || 100,
        since: options.since,
        until: options.until,
        path: options.path,
      }
    );

    // Fetch detailed information for each commit (including files changed)
    const detailedCommits = await Promise.all(
      commits.map(async (commit) => {
        try {
          const { data: commitDetail } = await octokit.request(
            "GET /repos/{owner}/{repo}/commits/{ref}",
            {
              owner,
              repo,
              ref: commit.sha,
            }
          );

          return {
            sha: commitDetail.sha,
            message: commitDetail.commit.message,
            author: commitDetail.commit.author?.name || "Unknown",
            date: commitDetail.commit.author?.date || new Date().toISOString(),
            files: (commitDetail.files || []).map((file: any) => ({
              filename: file.filename,
              status: file.status as "added" | "removed" | "modified" | "renamed",
              additions: file.additions || 0,
              deletions: file.deletions || 0,
              changes: file.changes || 0,
              patch: file.patch,
            })),
          };
        } catch (error) {
          console.error(`Failed to fetch details for commit ${commit.sha}:`, error);
          // Return basic info if detailed fetch fails
          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || "Unknown",
            date: commit.commit.author?.date || new Date().toISOString(),
            files: [],
          };
        }
      })
    );

    return detailedCommits;
  } catch (error) {
    console.error("Failed to fetch commits:", error);
    throw new Error(
      `Failed to fetch commits from ${owner}/${repo}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetches commits within a specific date range
 */
export async function getCommitsByDateRange(
  owner: string,
  repo: string,
  installationId: string,
  startDate: Date,
  endDate: Date
): Promise<GitCommit[]> {
  return getRecentCommits(owner, repo, installationId, {
    since: startDate.toISOString(),
    until: endDate.toISOString(),
    limit: 100,
  });
}

/**
 * Groups commits by file
 * Useful for finding which commits affected specific files
 */
export function groupCommitsByFile(commits: GitCommit[]): Map<string, GitCommit[]> {
  const fileMap = new Map<string, GitCommit[]>();

  for (const commit of commits) {
    for (const file of commit.files) {
      const existing = fileMap.get(file.filename) || [];
      existing.push(commit);
      fileMap.set(file.filename, existing);
    }
  }

  return fileMap;
}

/**
 * Extracts a summary of changes from commits
 */
export function summarizeCommits(commits: GitCommit[]): {
  totalCommits: number;
  filesChanged: Set<string>;
  totalAdditions: number;
  totalDeletions: number;
  authors: Set<string>;
} {
  const filesChanged = new Set<string>();
  const authors = new Set<string>();
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const commit of commits) {
    authors.add(commit.author);
    for (const file of commit.files) {
      filesChanged.add(file.filename);
      totalAdditions += file.additions;
      totalDeletions += file.deletions;
    }
  }

  return {
    totalCommits: commits.length,
    filesChanged,
    totalAdditions,
    totalDeletions,
    authors,
  };
}

/**
 * Filters commits that contain code-related changes
 */
export function filterCodeCommits(commits: GitCommit[]): GitCommit[] {
  const codeExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".java",
    ".go",
    ".rs",
    ".c",
    ".cpp",
    ".cs",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".sql",
  ];

  return commits.filter((commit) => {
    return commit.files.some((file) => {
      return codeExtensions.some((ext) => file.filename.endsWith(ext));
    });
  });
}
