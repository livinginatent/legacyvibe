/**
 * Scan Interface - Client Component for Interactive Scanning
 * Handles the scan trigger, progress display, and results rendering
 */

"use client";

import { useState } from "react";
import { Loader2, Terminal, Cpu, Code2, ArrowLeft } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";

interface FeatureCluster {
  name: string;
  description: string;
  files?: string[];
}

interface TechStack {
  languages: string[];
  libraries: string[];
  frameworks: string[];
}

interface AnalysisResult {
  techStack?: TechStack;
  featureClusters?: FeatureCluster[];
  rawResponse?: string;
}

interface ScanInterfaceProps {
  repoFullName: string;
  installationId?: string;
}

export function ScanInterface({ repoFullName, installationId }: ScanInterfaceProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [owner, repo] = repoFullName.split("/");

  const handleScan = async () => {
    // Check if GitHub is connected
    if (!installationId) {
      setError("GitHub App not connected. Please connect your GitHub account from the dashboard.");
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setError(null);
    setResult(null);

    console.log("Starting scan:", { owner, repo, installationId });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const requestBody = {
        owner,
        repo,
        installationId,
      };
      
      console.log("Request body:", requestBody);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Analysis failed");
      }

      const text = await response.text();
      console.log("API response:", text);
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(text);
        setResult(parsed);
      } catch {
        // If not JSON, store raw response
        setResult({ rawResponse: text });
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Scan Button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 font-mono">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2 relative overflow-hidden group"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SCANNING...</span>
            </>
          ) : (
            <>
              <Terminal className="w-4 h-4" />
              <span>START SCAN</span>
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="glass-card border border-primary/30 p-6 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-mono text-primary font-semibold">
                  SYSTEM RECONSTRUCTING...
                </span>
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-2 font-mono text-xs text-muted-foreground">
              <p className={progress > 20 ? "text-primary" : ""}>
                → Scanning file structure...
              </p>
              <p className={progress > 40 ? "text-primary" : ""}>
                → Analyzing dependencies...
              </p>
              <p className={progress > 60 ? "text-primary" : ""}>
                → Identifying feature clusters...
              </p>
              <p className={progress > 80 ? "text-primary" : ""}>
                → Reconstructing project vibe...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                SCAN FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results - Two Column Layout */}
      {result && !isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Left Column: Feature Clusters (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-primary" />
              FEATURE CLUSTERS
            </h2>

            {result.featureClusters && result.featureClusters.length > 0 ? (
              <div className="grid gap-4">
                {result.featureClusters.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-card border border-primary/20 p-6 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <h3 className="text-lg font-mono font-semibold text-primary mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                        {feature.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      {feature.files && feature.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <p className="text-xs font-mono text-muted-foreground/70">
                            {feature.files.length} files
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Scan line effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card border border-primary/20 p-8 text-center">
                <p className="font-mono text-muted-foreground">
                  {result.rawResponse || "No feature clusters detected"}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Tech Stack (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-secondary" />
              TECH STACK
            </h2>

            <div className="glass-card border border-secondary/20 p-6 sticky top-24">
              {result.techStack ? (
                <div className="space-y-4">
                  {/* Languages */}
                  {result.techStack.languages &&
                    result.techStack.languages.length > 0 && (
                      <div>
                        <h3 className="text-xs font-mono font-semibold text-secondary uppercase tracking-wider mb-2">
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.techStack.languages.map((lang, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/30 text-secondary rounded font-mono text-xs"
                            >
                              <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Frameworks */}
                  {result.techStack.frameworks &&
                    result.techStack.frameworks.length > 0 && (
                      <div>
                        <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider mb-2">
                          Frameworks
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.techStack.frameworks.map((framework, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded font-mono text-xs"
                            >
                              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {framework}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Libraries */}
                  {result.techStack.libraries &&
                    result.techStack.libraries.length > 0 && (
                      <div>
                        <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Libraries
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.techStack.libraries.map((lib, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/30 border border-muted text-muted-foreground rounded font-mono text-xs"
                            >
                              {lib}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm font-mono text-muted-foreground text-center">
                  No tech stack data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Before Scan */}
      {!result && !isScanning && !error && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Terminal className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Ready to Analyze
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Click &quot;START SCAN&quot; to begin analyzing this repository. The
            system will identify feature clusters and reconstruct the project
            architecture.
          </p>
        </div>
      )}
    </div>
  );
}
