/**
 * Dashboard page - Main workspace for managing legacy code projects.
 * Provides overview of active projects, quick actions, and system status.
 * Built with glassmorphism and cyber-tech aesthetic.
 */

import { DashboardSidebar } from "@/app/src/components/dashboard/sidebar";
import { NewProjectCard } from "@/app/src/components/dashboard/new-project-card";
import { ProjectList } from "@/app/src/components/dashboard/project-list";

export default function DashboardPage() {
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

          {/* Project List */}
          <div>
            <ProjectList />
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
