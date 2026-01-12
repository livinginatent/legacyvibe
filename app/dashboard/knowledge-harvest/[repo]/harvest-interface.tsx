/**
 * Knowledge Harvest Interface - Client Component for Deep Code Analysis
 * Displays comprehensive analysis with file details, dependencies, and architecture insights
 */

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Terminal,
  Cpu,
  Code2,
  ArrowLeft,
  FileDown,
  FileCode,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import { exportAnalysisToPDF } from "./export-pdf";

interface FeatureCluster {
  name: string;
  description: string;
  files?: string[];
  keyFiles?: string[];
  dependencies?: string[];
}

interface TechStack {
  languages: string[];
  libraries: string[];
  frameworks: string[];
}

interface Architecture {
  pattern: string;
  description: string;
}

interface AnalysisResult {
  techStack?: TechStack;
  featureClusters?: FeatureCluster[];
  architecture?: Architecture;
  rawResponse?: string;
  cached?: boolean;
  analyzedAt?: string;
}

interface HarvestInterfaceProps {
  repoFullName: string;
  installationId?: string;
}

export function HarvestInterface({
  repoFullName,
  installationId,
}: HarvestInterfaceProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceRescan, setForceRescan] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(
    new Set()
  );

  const [owner, repo] = repoFullName.split("/");

  const toggleCluster = (index: number) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClusters(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Load cached analysis on component mount
  useEffect(() => {
    const loadCachedAnalysis = async () => {
      if (!installationId) {
        setIsLoadingCache(false);
        return;
      }

      try {
        console.log("Checking for cached analysis...");
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner,
            repo,
            installationId,
            forceRescan: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.cached) {
            console.log("Loaded cached analysis");
            setResult(data);
          }
        }
      } catch (err) {
        console.error("Failed to load cached analysis:", err);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadCachedAnalysis();
  }, [owner, repo, installationId]);

  const handleScan = async () => {
    // Check if GitHub is connected
    if (!installationId) {
      setError(
        "GitHub App not connected. Please connect your GitHub account from the dashboard."
      );
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setError(null);
    setResult(null);

    console.log("Starting harvest:", { owner, repo, installationId });

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
        forceRescan,
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
        setForceRescan(false); // Reset force rescan flag
        // Expand all clusters by default after successful scan
        if (parsed.featureClusters) {
          setExpandedClusters(
            new Set(parsed.featureClusters.map((_: unknown, i: number) => i))
          );
        }
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

  const handleExportPDF = () => {
    if (!result) return;

    exportAnalysisToPDF(repoFullName, {
      techStack: result.techStack,
      featureClusters: result.featureClusters,
      architecture: result.architecture,
      analyzedAt: result.analyzedAt,
      cached: result.cached,
    });
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

        <div className="flex items-center gap-3">
          {result?.cached && result?.analyzedAt && (
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Cached • {formatDate(result.analyzedAt)}
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2 relative overflow-hidden group"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>HARVESTING...</span>
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                <span>{result ? "REHARVEST" : "START HARVEST"}</span>
              </>
            )}
          </Button>

          {result && !isScanning && (
            <>
              <Button
                onClick={() => {
                  setForceRescan(true);
                  setTimeout(() => handleScan(), 100);
                }}
                variant="outline"
                className="border-primary/50 hover:bg-primary/10 font-mono gap-2"
              >
                <Terminal className="w-4 h-4" />
                Force Rescan
              </Button>

              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-secondary/50 hover:bg-secondary/10 text-secondary hover:text-secondary font-mono gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="glass-card border border-primary/30 p-6 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-mono text-primary font-semibold">
                  KNOWLEDGE HARVESTING IN PROGRESS...
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
              <p className={progress > 15 ? "text-primary" : ""}>
                → Scanning file structure...
              </p>
              <p className={progress > 30 ? "text-primary" : ""}>
                → Analyzing manifest files...
              </p>
              <p className={progress > 50 ? "text-primary" : ""}>
                → Extracting feature clusters...
              </p>
              <p className={progress > 70 ? "text-primary" : ""}>
                → Identifying key files and dependencies...
              </p>
              <p className={progress > 85 ? "text-primary" : ""}>
                → Reconstructing architecture patterns...
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
                HARVEST FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results - Enhanced Layout */}
      {result && !isScanning && (
        <div className="space-y-6">
          {/* Analysis Info Banner */}
          {result.analyzedAt && (
            <div
              className={`glass-card border ${
                result.cached
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-primary/30 bg-primary/5"
              } p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      result.cached ? "bg-green-500" : "bg-primary"
                    } animate-pulse`}
                  />
                  <span className="font-mono text-sm text-foreground">
                    {result.cached
                      ? `Showing cached harvest from ${formatDate(
                          result.analyzedAt
                        )}`
                      : "Fresh harvest completed"}
                  </span>
                </div>
                {result.cached && (
                  <span className="text-xs font-mono text-muted-foreground">
                    Click &quot;Force Rescan&quot; to regenerate
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Architecture Pattern Card */}
          {result.architecture && (
            <div className="glass-card border border-secondary/30 p-6 bg-gradient-to-br from-secondary/5 to-transparent animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                  <Layers className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-mono font-bold text-secondary mb-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-pulse" />
                    ARCHITECTURE PATTERN
                  </h3>
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 bg-secondary/20 border border-secondary/40 text-secondary rounded font-mono text-sm font-semibold">
                      {result.architecture.pattern}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.architecture.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Feature Clusters (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                FEATURE CLUSTERS
                {result.featureClusters && (
                  <span className="text-sm text-muted-foreground font-normal">
                    ({result.featureClusters.length} discovered)
                  </span>
                )}
              </h2>

              {result.featureClusters && result.featureClusters.length > 0 ? (
                <div className="grid gap-4">
                  {result.featureClusters.map((feature, index) => {
                    const isExpanded = expandedClusters.has(index);
                    return (
                      <div
                        key={index}
                        className="glass-card border border-primary/20 p-6 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-mono font-semibold text-primary flex items-center gap-2 flex-1">
                              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                              {feature.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCluster(index)}
                              className="h-6 w-6 p-0 hover:bg-primary/10"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {feature.description}
                          </p>

                          {/* Expandable Section */}
                          {isExpanded && (
                            <div className="space-y-4 pt-4 border-t border-primary/10 animate-fade-in-up">
                              {/* Key Files */}
                              {feature.keyFiles &&
                                feature.keyFiles.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <FileCode className="w-3 h-3" />
                                      Key Files
                                    </h4>
                                    <div className="space-y-1">
                                      {feature.keyFiles.map((file, i) => (
                                        <div
                                          key={i}
                                          className="text-xs font-mono text-muted-foreground bg-zinc-900/50 px-2 py-1 rounded border border-primary/5"
                                        >
                                          {file}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* All Files */}
                              {feature.files && feature.files.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FileCode className="w-3 h-3" />
                                    Related Files ({feature.files.length})
                                  </h4>
                                  <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                                    {feature.files.map((file, i) => (
                                      <div
                                        key={i}
                                        className="text-xs font-mono text-muted-foreground/70 px-2 py-0.5"
                                      >
                                        • {file}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Dependencies */}
                              {feature.dependencies &&
                                feature.dependencies.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-mono font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <Package className="w-3 h-3" />
                                      Dependencies
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {feature.dependencies.map((dep, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary/10 border border-secondary/30 text-secondary rounded font-mono text-xs"
                                        >
                                          {dep}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                          {/* Collapsed Summary */}
                          {!isExpanded && (
                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/70">
                              {feature.keyFiles && feature.keyFiles.length > 0 && (
                                <span>{feature.keyFiles.length} key files</span>
                              )}
                              {feature.files && feature.files.length > 0 && (
                                <span>
                                  {feature.files.length} total files
                                </span>
                              )}
                              {feature.dependencies &&
                                feature.dependencies.length > 0 && (
                                  <span>
                                    {feature.dependencies.length} dependencies
                                  </span>
                                )}
                            </div>
                          )}
                        </div>

                        {/* Scan line effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
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
        </div>
      )}

      {/* Loading Cache State */}
      {isLoadingCache && !result && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Checking for cached harvest...
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Loading previous analysis if available
          </p>
        </div>
      )}

      {/* Empty State - Before Scan */}
      {!result && !isScanning && !error && !isLoadingCache && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Terminal className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Ready to Harvest Knowledge
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Click &quot;START HARVEST&quot; to begin deep analysis of this
            repository. The system will extract feature clusters, identify key
            files, map dependencies, and reconstruct the architecture pattern.
          </p>
        </div>
      )}
    </div>
  );
}
