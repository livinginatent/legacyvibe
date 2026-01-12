/**
 * Project List - Table view of GitHub repositories.
 * Fetches and displays the authenticated user's GitHub repositories.
 * Uses the same UI style as the original project list with real data.
 */

import { getUserRepos, GitHubRepo } from "@/services/github";
import { Github, AlertCircle, ExternalLink, Terminal } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import { ConnectGitHubButton } from "./connect-github-button";

// Language color mapping for visual indicators
const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-500",
  Python: "bg-green-500",
  Java: "bg-orange-500",
  Go: "bg-cyan-500",
  Rust: "bg-red-500",
  Ruby: "bg-red-400",
  PHP: "bg-purple-500",
  "C#": "bg-green-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  default: "bg-primary",
};

function getLanguageColor(language: string | null): string {
  if (!language) return languageColors.default;
  return languageColors[language] || languageColors.default;
}

/**
 * Empty state when no GitHub repos are connected
 */
function EmptyState() {
  return (
    <div className="glass-card border border-primary/20">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Github className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-mono font-semibold text-foreground mb-2">
          Connect Your Repositories
        </h3>
        <p className="text-sm text-muted-foreground font-mono max-w-md mb-6">
          Install the LegacyVibe GitHub App to grant access to your repositories
          and start analyzing your code.
        </p>
        <ConnectGitHubButton />
        <p className="text-xs text-muted-foreground font-mono mt-4">
          You&apos;ll be able to select which repositories to grant access to
        </p>
      </div>
    </div>
  );
}

/**
 * Error state when repo fetch fails
 */
function ErrorState({ error }: { error: string }) {
  return (
    <div className="glass-card border border-destructive/20">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-mono font-semibold text-foreground mb-2">
          Failed to load repositories
        </h3>
        <p className="text-sm text-muted-foreground font-mono max-w-md">
          {error}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-4">
          Please try refreshing the page or reconnecting GitHub.
        </p>
      </div>
    </div>
  );
}

/**
 * Repository table row
 */
function RepoRow({ repo, index }: { repo: GitHubRepo; index: number }) {
  const languageColor = getLanguageColor(repo.language);

  return (
    <tr
      className="hover:bg-primary/5 transition-colors duration-200 group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Repo Name */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-mono text-primary text-xs font-bold">
            {repo.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-foreground font-medium">
              {repo.name}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {repo.full_name}
            </span>
          </div>
        </div>
      </td>

      {/* Language */}
      <td className="px-6 py-4">
        {repo.language ? (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${languageColor}`} />
            <span className="font-mono text-sm text-muted-foreground">
              {repo.language}
            </span>
          </div>
        ) : (
          <span className="font-mono text-sm text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Description */}
      <td className="px-6 py-4 max-w-xs">
        <span className="font-mono text-sm text-muted-foreground line-clamp-1">
          {repo.description || "No description"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/dashboard/scan/${encodeURIComponent(repo.full_name)}`}>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 hover:bg-primary/10 hover:text-primary font-mono text-xs gap-2"
            >
              <Terminal className="w-3 h-3" />
              SCAN
            </Button>
          </Link>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </td>
    </tr>
  );
}

/**
 * Repository table component
 */
function RepoTable({ repos }: { repos: GitHubRepo[] }) {
  return (
    <div className="glass-card border border-primary/20">
      {/* Header */}
      <div className="p-6 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Your Repositories
            </h2>
            <p className="text-sm font-mono text-muted-foreground">
              {repos.length}{" "}
              {repos.length === 1 ? "repository" : "repositories"} connected via
              GitHub
            </p>
          </div>
          <ConnectGitHubButton variant="outline" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Repository
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-right text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {repos.map((repo, index) => (
              <RepoRow key={repo.id} repo={repo} index={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-primary/10 flex items-center justify-between">
        <div className="text-sm font-mono text-muted-foreground">
          Showing{" "}
          <span className="text-primary font-semibold">{repos.length}</span>{" "}
          {repos.length === 1 ? "repository" : "repositories"}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled
            className="border-primary/30"
          >
            Previous
          </Button>
          <Button size="sm" variant="outline" className="border-primary/50">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Project List Component
 * Server Component that fetches repos from GitHub and renders them in a table.
 */
export async function ProjectList() {
  // Fetch user repositories from GitHub API
  const result = await getUserRepos();

  // Handle error case
  if ("error" in result) {
    return <ErrorState error={result.error} />;
  }

  // Handle empty state
  if (result.length === 0) {
    return <EmptyState />;
  }

  // Render table with repos
  return <RepoTable repos={result} />;
}
