/**
 * GitHub Commit Checker - Detects if repository has new commits since last analysis
 */

import { App } from "octokit";

/**
 * Check if repository has new commits since the last analysis
 * @returns true if there are new commits, false if no changes
 */
export async function hasNewCommits(
  owner: string,
  repo: string,
  installationId: string,
  lastAnalyzedAt: string
): Promise<boolean> {
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(parseInt(installationId));

  try {
    // Get commits since last analysis
    const { data: commits } = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner,
        repo,
        since: lastAnalyzedAt,
        per_page: 1, // We only need to know if there's at least one commit
      }
    );

    return commits.length > 0;
  } catch (error) {
    console.error("Failed to check for new commits:", error);
    // If we can't check, assume there are changes to be safe
    return true;
  }
}

/**
 * Get the latest commit SHA
 */
export async function getLatestCommitSha(
  owner: string,
  repo: string,
  installationId: string
): Promise<string | null> {
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(parseInt(installationId));

  try {
    const { data: repoData } = await octokit.request(
      "GET /repos/{owner}/{repo}",
      {
        owner,
        repo,
      }
    );

    const defaultBranch = repoData.default_branch;

    const { data: commit } = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      {
        owner,
        repo,
        ref: defaultBranch,
      }
    );

    return commit.sha;
  } catch (error) {
    console.error("Failed to get latest commit SHA:", error);
    return null;
  }
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
