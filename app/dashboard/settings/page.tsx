/**
 * Settings Page - User profile and data management
 */

import { Suspense } from "react";
import { DashboardSidebar } from "@/app/src/components/dashboard/sidebar";
import { SettingsContent } from "@/app/src/components/dashboard/settings-content";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="flex mt-12 h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Suspense
            fallback={
              <div className="glass-card border border-primary/20">
                <div className="flex items-center justify-center py-16 px-6">
                  <div className="flex items-center gap-3 text-primary font-mono text-lg animate-pulse">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span>[ LOADING SETTINGS... ]</span>
                  </div>
                </div>
              </div>
            }
          >
            <SettingsContent />
          </Suspense>
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
