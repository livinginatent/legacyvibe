/**
 * Dashboard page - Main workspace for managing legacy code projects.
 * Provides overview of active projects, quick actions, and system status.
 * Built with glassmorphism and cyber-tech aesthetic.
 *
 * Handles GitHub App installation callback by capturing installation_id from URL.
 */

import { Suspense } from "react";
import { DashboardSidebar } from "@/app/src/components/dashboard/sidebar";
import { NewProjectCard } from "@/app/src/components/dashboard/new-project-card";
import { ProjectList } from "@/app/src/components/dashboard/project-list";
import { saveInstallationId } from "@/services/github";
import { redirect } from "next/navigation";

// Force this page to be dynamic (not statically generated)
// This is required because we need access to authenticated user sessions
export const dynamic = "force-dynamic";

/**
 * Dashboard Page Component
 * Accepts installation_id from GitHub App installation flow via searchParams
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string }>;
}) {
  // Await searchParams (required in Next.js 16+)
  const params = await searchParams;

  // Handle GitHub App installation callback
  if (params.installation_id) {
    const success = await saveInstallationId(params.installation_id);

    if (success) {
      // Redirect to clean URL after saving installation_id
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Monitor and manage your legacy code projects
            </p>
          </div>

          {/* New Project Card */}
          <div className="mb-8">
            <NewProjectCard />
          </div>

          {/* GitHub Repositories */}
          <div>
            <Suspense
              fallback={
                <div className="glass-card border border-primary/20">
                  <div className="flex items-center justify-center py-16 px-6">
                    <div className="flex items-center gap-3 text-primary font-mono text-lg animate-pulse">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-ping" />
                      <span>[ LOADING REPOSITORIES... ]</span>
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-ping animation-delay-200" />
                    </div>
                  </div>
                </div>
              }
            >
              <ProjectList />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
