/**
 * GitHub API Service
 * Handles all GitHub API interactions using the GitHub App installation flow.
 * Uses Octokit's App class for type-safe GitHub API access as a GitHub App.
 *
 * This service authenticates as the Cadracode GitHub App and uses the
 * installation_id to fetch only repositories that the user has explicitly
 * granted Cadracode access to.
 *
 * Security: Never logs access tokens or private keys (follows api-security rule).
 */

import { App } from "octokit";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";

/**
 * Repository data structure returned by GitHub API
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
}

/**
 * GitHub App Installation data structure
 */
export interface GitHubInstallation {
  installation_id: string;
  account_login: string;
  account_type: string;
}

/**
 * Initializes the GitHub App instance using environment variables.
 * This app instance is used to authenticate as the Cadracode GitHub App.
 *
 * @returns Configured App instance
 * @throws Error if required environment variables are missing
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
 * Gets the GitHub App installation_id for the current user.
 * This ID is obtained when the user installs the Cadracode GitHub App.
 *
 * The installation_id is stored in the user's metadata after successful installation.
 *
 * @returns The installation_id as a string, or null if not found
 */
async function getInstallationId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Silent return during build time or when user is not authenticated
      return null;
    }

    // Check if installation_id is stored in user metadata
    const installationId = user.user_metadata?.github_installation_id;

    if (!installationId) {
      // Silent return when installation_id is not set
      return null;
    }

    return installationId;
  } catch (error) {
    // Silent return on any error
    return null;
  }
}

/**
 * Result type for getUserRepos - either repos array or error object
 */
export type GetReposResult = GitHubRepo[] | { error: string };

/**
 * Fetches repositories that the user has granted Cadracode access to via GitHub App installation.
 * Only returns repositories explicitly authorized during the GitHub App installation flow.
 *
 * Authenticates as the Cadracode GitHub App using the installation_id to ensure
 * users have full control over which repositories Cadracode can analyze.
 *
 * @returns Array of repository objects or error object
 */
export async function getUserRepos(): Promise<GetReposResult> {
  // Get the installation_id from the user's Supabase profile
  const installationId = await getInstallationId();

  if (!installationId) {
    // Return empty array - user needs to connect GitHub
    return [];
  }

  // Verify GitHub App credentials are configured
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_PRIVATE_KEY) {
    console.warn("GitHub App credentials not configured");
    return { error: "GitHub App is not configured. Please contact support." };
  }

  try {
    // Initialize the GitHub App
    const app = getGitHubApp();

    // Get an Octokit instance authenticated for this specific installation
    // This allows us to act on behalf of the user within the scope they authorized
    const octokit = await app.getInstallationOctokit(parseInt(installationId));

    // Fetch repositories accessible through the GitHub App installation
    // This endpoint returns only repositories the user explicitly granted access to
    const { data } = await octokit.request("GET /installation/repositories", {
      per_page: 100, // Fetch up to 100 repos
    });

    // Map to our simplified repository structure
    return data.repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
    }));
  } catch (error) {
    // Check if the error is a 404 (installation not found / app uninstalled)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isNotFound =
      errorMessage.includes("Not Found") ||
      errorMessage.includes("404") ||
      (error as any)?.status === 404;

    if (isNotFound) {
      console.log(
        "GitHub App installation not found - clearing stored installation_id"
      );

      // Clear the invalid installation_id from user metadata
      await clearInstallationId();

      return {
        error:
          "GitHub App is not connected. Please connect the GitHub App to access your repositories.",
      };
    }

    // Log other errors and return generic error message
    console.error("Failed to fetch user repos:", errorMessage);
    return {
      error: "Failed to fetch repositories. Please try reconnecting GitHub.",
    };
  }
}

/**
 * Stores the GitHub App installation_id in the user's metadata.
 * Called after successful GitHub App installation.
 *
 * @param installationId - The installation_id from GitHub App installation
 * @returns Success status
 */
export async function saveInstallationId(
  installationId: string
): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.updateUser({
      data: {
        github_installation_id: installationId,
      },
    });

    if (error) {
      console.error("Failed to save installation_id:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Error saving installation_id:",
      "Failed to update user metadata"
    );
    return false;
  }
}

/**
 * Clears the GitHub App installation_id from the user's metadata.
 * Called when the GitHub App is uninstalled or the installation is invalid.
 *
 * @returns Success status
 */
export async function clearInstallationId(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.updateUser({
      data: {
        github_installation_id: null,
      },
    });

    if (error) {
      console.error("Failed to clear installation_id:", error.message);
      return false;
    }

    console.log("Successfully cleared installation_id");
    return true;
  } catch (error) {
    console.error("Error clearing installation_id:", error);
    return false;
  }
}
