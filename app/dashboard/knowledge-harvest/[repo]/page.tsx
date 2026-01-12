/**
 * Knowledge Harvest Page - Deep repository analysis with AI
 * Extracts detailed insights about features, architecture, and tech stack
 * Uses tech-vibe-ui aesthetic with glowing cards and terminal styling
 */

import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/app/src/utils/supabase/server";
import { HarvestInterface } from "./harvest-interface";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ repo: string }>;
}

export default async function KnowledgeHarvestPage({ params }: PageProps) {
  const { repo } = await params;
  const decodedRepo = decodeURIComponent(repo);

  // Get installation ID from user metadata
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const installationId = user?.user_metadata?.github_installation_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-primary/20 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-mono tracking-wider">
                [ KNOWLEDGE HARVEST ]
              </h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {decodedRepo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-primary font-mono text-lg animate-pulse">
                <span className="inline-block w-2 h-2 bg-primary rounded-full animate-ping" />
                <span>[ INITIALIZING HARVEST SYSTEM... ]</span>
              </div>
            </div>
          }
        >
          <HarvestInterface repoFullName={decodedRepo} installationId={installationId} />
        </Suspense>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
