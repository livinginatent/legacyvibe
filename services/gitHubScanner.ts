/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from "octokit";

export class GithubScanner {
  private octokitPromise: Promise<any>;

  constructor(installationId: number) {
    const app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!,
    });
    // We get the specific octokit instance for this user's installation
    this.octokitPromise = app.getInstallationOctokit(installationId);
  }

  /**
   * Crawls the repo to get the full structure and identifies key manifest files.
   */
  async scanRepository(owner: string, repo: string) {
    try {
      // Await the octokit instance
      const octokit = await this.octokitPromise;

      // 1. Get the default branch
      const { data: repoData } = await octokit.request(
        "GET /repos/{owner}/{repo}",
        { owner, repo }
      );
      const defaultBranch = repoData.default_branch;

      // 2. Get the recursive tree (limit to 1000 files for "Vibe" speed)
      const { data: treeData } = await octokit.request(
        "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1",
        {
          owner,
          repo,
          tree_sha: defaultBranch,
        }
      );

      const fullTree = treeData.tree;

      // 3. Filter out noise (binaries, node_modules, .git, etc.)
      const filteredTree = fullTree.filter((file: any) => {
        const path = file.path;
        return (
          file.type === "blob" &&
          !path.includes("node_modules/") &&
          !path.includes(".git/") &&
          !path.match(/\.(jpg|jpeg|png|gif|zip|exe|pdf|lock|ico)$/i)
        );
      });

      // 4. Identify "Manifests" (The DNA of the project)
      const manifests = [
        "package.json",
        "requirements.txt",
        "go.mod",
        "Cargo.toml",
        "Gemfile",
        "app.py",
        "main.go",
      ];
      const foundManifests: Record<string, string> = {};

      for (const file of filteredTree) {
        const fileName = file.path.split("/").pop();
        if (manifests.includes(fileName)) {
          const { data: contentData } = await octokit.request(
            "GET /repos/{owner}/{repo}/contents/{path}",
            { owner, repo, path: file.path }
          );

          // GitHub returns content in Base64
          const content = Buffer.from(contentData.content, "base64").toString(
            "utf-8"
          );
          foundManifests[file.path] = content;
        }
      }

      return {
        tree: filteredTree.map((f: any) => f.path),
        manifests: foundManifests,
      };
    } catch (error) {
      console.error("Scan failed:", error);
      throw new Error("Failed to crawl repository structure.");
    }
  }
}
