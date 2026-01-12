/**
 * Vibe History Interface - Client Component for Chat History Analysis
 * Uploads and analyzes chat/prompt history to connect conversations with code changes
 */

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Terminal,
  Upload,
  ArrowLeft,
  FileDown,
  MessageSquare,
  GitCommit,
  Clock,
  FileText,
  Link2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import { exportHistoryToPDF } from "./export-pdf";

// Future enhancement: Parse chat messages from uploaded files
// interface ChatMessage {
//   role: "user" | "assistant";
//   content: string;
//   timestamp?: string;
// }

interface CodeChange {
  file: string;
  changes: string;
  timestamp?: string;
  commit?: string;
}

interface VibeLink {
  id: string;
  chatExcerpt: string;
  codeChanges: CodeChange[];
  reasoning: string;
  confidence: number;
  timestamp: string;
}

interface AnalysisResult {
  vibeLinks: VibeLink[];
  totalMessages: number;
  totalChanges: number;
  analyzedAt: string;
}

interface VibeHistoryInterfaceProps {
  repoFullName: string;
  installationId?: string;
}

export function VibeHistoryInterface({
  repoFullName,
  installationId,
}: VibeHistoryInterfaceProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [owner, repo] = repoFullName.split("/");

  const toggleLink = (linkId: string) => {
    const newExpanded = new Set(expandedLinks);
    if (newExpanded.has(linkId)) {
      newExpanded.delete(linkId);
    } else {
      newExpanded.add(linkId);
    }
    setExpandedLinks(newExpanded);
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
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
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
        console.log("Checking for cached vibe history...");
        const response = await fetch(
          `/api/vibe-history?repo=${encodeURIComponent(repoFullName)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.cached) {
            console.log("Loaded cached vibe history");
            setResult(data);
            // Expand all links by default
            if (data.vibeLinks) {
              setExpandedLinks(
                new Set(data.vibeLinks.map((link: VibeLink) => link.id))
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to load cached vibe history:", err);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadCachedAnalysis();
  }, [repoFullName, installationId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [".txt", ".md", ".json", ".log"];
      const fileExt = file.name.substring(file.name.lastIndexOf("."));

      if (!validTypes.includes(fileExt)) {
        setError(
          `Invalid file type. Please upload a ${validTypes.join(", ")} file.`
        );
        return;
      }

      setUploadedFile(file);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError("Please upload a chat history file first.");
      return;
    }

    if (!installationId) {
      setError(
        "GitHub App not connected. Please connect your GitHub account from the dashboard."
      );
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10;
      });
    }, 600);

    try {
      // Read file content
      const fileContent = await uploadedFile.text();
      console.log(
        `Analyzing ${fileContent.length} characters of chat history...`
      );

      const requestBody = {
        owner,
        repo,
        installationId,
        fileContent,
        fileName: uploadedFile.name,
        forceReanalyze: false,
      };

      const response = await fetch("/api/vibe-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);

      // Expand all links by default
      if (data.vibeLinks) {
        setExpandedLinks(
          new Set(data.vibeLinks.map((link: VibeLink) => link.id))
        );
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = () => {
    if (!result) return;

    exportHistoryToPDF(repoFullName, {
      vibeLinks: result.vibeLinks,
      totalMessages: result.totalMessages,
      totalChanges: result.totalChanges,
      analyzedAt: result.analyzedAt,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90)
      return "text-green-500 border-green-500/30 bg-green-500/10";
    if (confidence >= 75)
      return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
    return "text-orange-500 border-orange-500/30 bg-orange-500/10";
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 font-mono">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          {result && !isAnalyzing && (
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="border-secondary/50 hover:bg-secondary/10 text-secondary hover:text-secondary font-mono gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Loading Cache State */}
      {isLoadingCache && !result && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Checking for cached history...
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Loading previous analysis if available
          </p>
        </div>
      )}

      {/* Upload Section */}
      {!result && !isAnalyzing && !isLoadingCache && (
        <div className="glass-card border border-primary/30 p-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/30">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-mono font-bold text-foreground mb-2">
                Upload Your Chat History
              </h2>
              <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">
                Upload your Cursor or Claude chat history to connect
                conversations with code changes. Supported formats: .txt, .md,
                .json, .log
              </p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.log"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="glass-card border border-primary/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-mono text-sm text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10 font-mono gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </Button>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!uploadedFile || isAnalyzing}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2 w-full max-w-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ANALYZING...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4" />
                    <span>ANALYZE HISTORY</span>
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="pt-6 border-t border-primary/10">
              <h3 className="text-sm font-mono font-semibold text-foreground mb-3">
                How to export your chat history:
              </h3>
              <div className="space-y-2 text-xs font-mono text-muted-foreground text-left max-w-lg mx-auto">
                <p>
                  <span className="text-primary">→ Cursor:</span> Open the chat
                  panel, click the menu icon, select &quot;Export Chat&quot;
                </p>
                <p>
                  <span className="text-primary">→ Claude:</span> In your
                  conversation, click the three dots menu and select
                  &quot;Export conversation&quot;
                </p>
                <p>
                  <span className="text-primary">→ Custom:</span> Any text file
                  with conversation history will work
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="glass-card border border-primary/30 p-6 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-mono text-primary font-semibold">
                  ANALYZING VIBE HISTORY...
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
                → Parsing chat history...
              </p>
              <p className={progress > 40 ? "text-primary" : ""}>
                → Fetching repository changes...
              </p>
              <p className={progress > 60 ? "text-primary" : ""}>
                → Matching conversations to code changes...
              </p>
              <p className={progress > 80 ? "text-primary" : ""}>
                → Extracting reasoning and context...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                ANALYSIS FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card border border-primary/20 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {result.vibeLinks.length}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    Vibe Links Found
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card border border-secondary/20 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/30">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {result.totalMessages}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    Messages Analyzed
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card border border-primary/20 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <GitCommit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {result.totalChanges}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    Code Changes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vibe Links Timeline */}
          <div className="space-y-4">
            <h2 className="text-xl font-mono font-bold text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              CONVERSATION TO CODE TIMELINE
            </h2>

            <div className="space-y-4">
              {result.vibeLinks.map((link, index) => {
                const isExpanded = expandedLinks.has(link.id);
                const confidenceClass = getConfidenceColor(link.confidence);

                return (
                  <div
                    key={link.id}
                    className="glass-card border border-primary/20 p-6 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 rounded bg-primary/10 border border-primary/30">
                              <MessageSquare className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(link.timestamp)}
                            </div>
                            <div
                              className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${confidenceClass}`}
                            >
                              {link.confidence}% Match
                            </div>
                          </div>

                          {/* Chat Excerpt */}
                          <div className="bg-zinc-900/50 border border-primary/10 rounded p-3 mb-3">
                            <p className="text-sm font-mono text-muted-foreground italic line-clamp-2">
                              &quot;{link.chatExcerpt}&quot;
                            </p>
                          </div>

                          {/* Quick Stats */}
                          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GitCommit className="w-3 h-3" />
                              {link.codeChanges.length} file
                              {link.codeChanges.length !== 1 ? "s" : ""} changed
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLink(link.id)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-primary/10 animate-fade-in-up">
                          {/* Reasoning */}
                          <div>
                            <h4 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              AI-Detected Reasoning
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {link.reasoning}
                            </p>
                          </div>

                          {/* Code Changes */}
                          <div>
                            <h4 className="text-xs font-mono font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                              <GitCommit className="w-3 h-3" />
                              Related Code Changes
                            </h4>
                            <div className="space-y-2">
                              {link.codeChanges.map((change, i) => (
                                <div
                                  key={i}
                                  className="bg-zinc-900/50 border border-secondary/10 rounded p-3"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="text-xs font-mono text-secondary font-semibold">
                                      {change.file}
                                    </span>
                                    {change.timestamp && (
                                      <span className="text-xs font-mono text-muted-foreground">
                                        {formatDate(change.timestamp)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-mono text-muted-foreground">
                                    {change.changes}
                                  </p>
                                  {change.commit && (
                                    <div className="mt-2 flex items-center gap-1 text-xs font-mono text-muted-foreground/70">
                                      <GitCommit className="w-3 h-3" />
                                      <span>
                                        {change.commit.substring(0, 7)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scan line effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Footer */}
          <div className="glass-card border border-primary/10 p-4 text-center">
            <p className="text-xs font-mono text-muted-foreground">
              Analysis completed {formatDate(result.analyzedAt)} • Showing{" "}
              {result.vibeLinks.length} conversation-to-code links
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
