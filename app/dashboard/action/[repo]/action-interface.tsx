/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Blueprint Orchestrator Interface - Visual Canvas with React Flow
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Terminal,
  ArrowLeft,
  Zap,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  FileCode,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  AlertCircle,
  X,
  Play,
  Shield,
  BookOpen,
  Activity,
  Anchor,
  Flame,
  Copy,
  Database,
  Settings,
  ArrowRight,
  Search,
  Target,
  Waves,
  GraduationCap,
  MapPin,
  Clock,
  CheckSquare,
  ChevronRight,
  Lightbulb,
  Flag,
  FileDown,
  Download,
} from "lucide-react";
import { Button } from "@/app/src/components/ui/button";
import Link from "next/link";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { exportOnboardingToPDF } from "./export-onboarding-pdf";

interface FeatureNode {
  id: string;
  label: string;
  description: string;
  files: string[];
  risk: "High" | "Med" | "Low";
  vibe?: "stable" | "active" | "fragile" | "boilerplate";
  entryPoints?: string[];
  conventions?: string[];
}

interface FeatureEdge {
  source: string;
  target: string;
  label: string;
  type?: "data" | "control" | "config";
}

interface BlueprintGraph {
  nodes: FeatureNode[];
  edges: FeatureEdge[];
}

interface ArchitecturalDrift {
  addedNodes: FeatureNode[];
  removedNodes: FeatureNode[];
  modifiedNodes: Array<{ old: FeatureNode; new: FeatureNode }>;
  addedEdges: FeatureEdge[];
  removedEdges: FeatureEdge[];
  riskChanges: Array<{ node: string; oldRisk: string; newRisk: string }>;
}

interface AnalysisResult {
  blueprint: BlueprintGraph;
  analyzedAt: string;
  cached: boolean;
  drift: ArchitecturalDrift | null;
}

interface AffectedNode {
  id: string;
  label: string;
  description: string;
  risk: string;
  impactLevel: "direct" | "indirect" | "downstream";
  reason: string;
}

interface ImpactAnalysisResult {
  targetFile: string;
  directlyAffectedNodes: AffectedNode[];
  indirectlyAffectedNodes: AffectedNode[];
  downstreamNodes: AffectedNode[];
  totalAffectedFeatures: number;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  recommendations: string[];
  affectedEdges: string[];
}

interface LearningStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: "read" | "explore" | "modify" | "test";
  nodeId: string;
  nodeName: string;
  files: string[];
  objectives: string[];
  estimatedTime: number;
  prerequisites: string[];
  checkpoints: string[];
  hints: string[];
  completed?: boolean;
}

interface OnboardingPath {
  repoFullName: string;
  generatedAt: string;
  totalSteps: number;
  estimatedTotalTime: number;
  learningPath: LearningStep[];
  overview: string;
  keyTakeaways: string[];
}

interface ActionInterfaceProps {
  repoFullName: string;
  installationId?: string;
}

// Shared helpers for laying out nodes/edges so we don't repeat logic
const layoutBlueprintNodes = (
  blueprint: BlueprintGraph,
  handleNodeClick: (node: FeatureNode) => void
): Node[] => {
  const nodeCount = blueprint.nodes.length;
  const radius = Math.max(250, nodeCount * 40);
  const centerX = 400;
  const centerY = 300;

  return blueprint.nodes.map((node, index) => {
    const angle = (index / nodeCount) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      id: node.id,
      type: "vibeCard",
      position: { x, y },
      data: {
        ...node,
        onClick: () => handleNodeClick(node),
      },
    };
  });
};

const getEdgeColorForType = (edgeType?: string) => {
  switch (edgeType) {
    case "data":
      return "#00d4ff"; // Cyan for data flow
    case "control":
      return "#f59e0b"; // Orange for control flow
    case "config":
      return "#a78bfa"; // Purple for config
    default:
      return "#00d4ff"; // Default cyan
  }
};

const buildBlueprintEdges = (blueprint: BlueprintGraph): Edge[] => {
  return blueprint.edges.map((edge, index) => {
    const color = getEdgeColorForType(edge.type);

    return {
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: ConnectionLineType.Bezier,
      animated: edge.type === "data", // Only animate data flows
      style: {
        stroke: color,
        strokeWidth: edge.type === "control" ? 3 : 2,
        strokeDasharray: edge.type === "config" ? "5,5" : undefined,
        filter: `drop-shadow(0 0 8px ${color}66)`,
      },
      labelStyle: {
        fill: color,
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#000",
        fillOpacity: 0.9,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: color,
        width: 20,
        height: 20,
      },
      data: { edgeType: edge.type },
    };
  });
};

// Custom Vibe Card Node Component
function VibeCardNode({ data }: { data: any }) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
      case "Med":
        return "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]";
      case "Low":
        return "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
      default:
        return "border-cyan-500/50";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "High":
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case "Med":
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case "Low":
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getVibeIcon = (vibe?: string) => {
    switch (vibe) {
      case "stable":
        return <Anchor className="w-3 h-3 text-blue-400" />;
      case "active":
        return <Activity className="w-3 h-3 text-cyan-400" />;
      case "fragile":
        return <Flame className="w-3 h-3 text-orange-400" />;
      case "boilerplate":
        return <Copy className="w-3 h-3 text-purple-400" />;
      default:
        return null;
    }
  };

  const getVibeColor = (vibe?: string) => {
    switch (vibe) {
      case "stable":
        return "text-blue-400 border-blue-400/30 bg-blue-400/5";
      case "active":
        return "text-cyan-400 border-cyan-400/30 bg-cyan-400/5";
      case "fragile":
        return "text-orange-400 border-orange-400/30 bg-orange-400/5";
      case "boilerplate":
        return "text-purple-400 border-purple-400/30 bg-purple-400/5";
      default:
        return "";
    }
  };

  return (
    <div
      className="relative bg-black border-2 border-cyan-500/30 rounded-lg p-4 min-w-[280px] max-w-[320px] cursor-pointer transition-all duration-300 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] group"
      onClick={data.onClick}
    >
      {/* Cyan glow effect */}
      <div className="absolute inset-0 bg-cyan-500/5 rounded-lg blur-xl group-hover:bg-cyan-500/10 transition-all duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-mono font-bold text-cyan-400 flex-1 leading-tight">
            {data.label}
          </h3>
          <div className="flex flex-col gap-1 items-end">
            <div
              className={`px-2 py-1 rounded border text-[10px] font-mono font-semibold flex items-center gap-1 ${getRiskColor(
                data.risk
              )}`}
            >
              {getRiskIcon(data.risk)}
              {data.risk}
            </div>
            {data.vibe && (
              <div
                className={`px-2 py-1 rounded border text-[10px] font-mono font-semibold flex items-center gap-1 ${getVibeColor(
                  data.vibe
                )}`}
              >
                {getVibeIcon(data.vibe)}
                {data.vibe}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed font-mono line-clamp-3">
          {data.description}
        </p>

        {/* Bottom indicators */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-2 text-cyan-500/70">
            <FileCode className="w-3 h-3" />
            <span>{data.files?.length || 0} files</span>
          </div>
          {data.entryPoints && data.entryPoints.length > 0 && (
            <div className="flex items-center gap-1 text-emerald-500/70">
              <Play className="w-3 h-3" />
              <span>{data.entryPoints.length} entry pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Scan line effect on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

const nodeTypes = {
  vibeCard: VibeCardNode,
};

export function ActionInterface({
  repoFullName,
  installationId,
}: ActionInterfaceProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceRescan, setForceRescan] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FeatureNode | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  // Impact Analysis state
  const [showImpactSearch, setShowImpactSearch] = useState(false);
  const [impactSearchQuery, setImpactSearchQuery] = useState("");
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult | null>(
    null
  );
  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);

  // Onboarding state
  const [onboardingMode, setOnboardingMode] = useState(false);
  const [onboardingPath, setOnboardingPath] = useState<OnboardingPath | null>(
    null
  );
  const [isGeneratingOnboarding, setIsGeneratingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Documentation state
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Debt Heatmap state
  const [showDebtHeatmap, setShowDebtHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);

  // Usage tracking state
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [showUsageWarning, setShowUsageWarning] = useState(false);

  // Payment state
  const [showPaywall, setShowPaywall] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [owner, repo] = repoFullName.split("/");

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

  // Handle node click
  const handleNodeClick = useCallback((node: FeatureNode) => {
    setSelectedNode(node);
    setSidePanelOpen(true);
  }, []);

  // Convert blueprint to React Flow nodes and edges
  useEffect(() => {
    if (!result?.blueprint) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flowNodes = layoutBlueprintNodes(result.blueprint, handleNodeClick);
    const flowEdges = buildBlueprintEdges(result.blueprint);

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [result, handleNodeClick, setNodes, setEdges]);

  // Load cached analysis on mount
  useEffect(() => {
    const loadCachedAnalysis = async () => {
      if (!installationId) {
        setIsLoadingCache(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/analyze?repo=${encodeURIComponent(repoFullName)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.cached) {
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
  }, [repoFullName, installationId]);

  const handleImpactAnalysis = async () => {
    if (!impactSearchQuery.trim()) {
      setImpactError("Please enter a file path");
      return;
    }

    setIsAnalyzingImpact(true);
    setImpactError(null);
    setImpactResult(null);

    try {
      const response = await fetch("/api/impact-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName,
          filePath: impactSearchQuery.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Impact analysis failed");
      }

      const data: ImpactAnalysisResult = await response.json();
      setImpactResult(data);

      // Clear previous highlighting
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {},
        }))
      );

      // Highlight affected nodes
      const affectedNodeIds = new Set([
        ...data.directlyAffectedNodes.map((n) => n.id),
        ...data.indirectlyAffectedNodes.map((n) => n.id),
        ...data.downstreamNodes.map((n) => n.id),
      ]);

      setNodes((nds) =>
        nds.map((n) => {
          const directNode = data.directlyAffectedNodes.find(
            (an) => an.id === n.id
          );
          const indirectNode = data.indirectlyAffectedNodes.find(
            (an) => an.id === n.id
          );
          const downstreamNode = data.downstreamNodes.find(
            (an) => an.id === n.id
          );

          if (directNode) {
            return {
              ...n,
              style: {
                border: "3px solid #ef4444",
                boxShadow: "0 0 30px rgba(239, 68, 68, 0.6)",
              },
            };
          } else if (indirectNode) {
            return {
              ...n,
              style: {
                border: "3px solid #f59e0b",
                boxShadow: "0 0 30px rgba(245, 158, 11, 0.6)",
              },
            };
          } else if (downstreamNode) {
            return {
              ...n,
              style: {
                border: "3px solid #eab308",
                boxShadow: "0 0 30px rgba(234, 179, 8, 0.4)",
              },
            };
          }

          return n;
        })
      );

      // Highlight affected edges
      setEdges((eds) =>
        eds.map((e) => {
          const edgeKey = `${e.source}->${e.target}`;
          if (data.affectedEdges.includes(edgeKey)) {
            return {
              ...e,
              animated: true,
              style: {
                ...e.style,
                strokeWidth: 4,
                stroke: "#ef4444",
              },
            };
          }
          return e;
        })
      );
    } catch (err) {
      setImpactError(
        err instanceof Error ? err.message : "Impact analysis failed"
      );
    } finally {
      setIsAnalyzingImpact(false);
    }
  };

  // Onboarding functions
  const generateOnboardingPath = async () => {
    setIsGeneratingOnboarding(true);
    setOnboardingError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName,
          userLevel: "intermediate",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate onboarding path"
        );
      }

      const data: OnboardingPath = await response.json();

      // Validate response structure
      if (!data.learningPath || !Array.isArray(data.learningPath)) {
        throw new Error("Invalid onboarding path structure received from API");
      }

      // Load progress from localStorage
      const savedProgress = localStorage.getItem(`onboarding-${repoFullName}`);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          data.learningPath = data.learningPath.map((step) => ({
            ...step,
            completed: progress[step.id] || false,
          }));
        } catch (e) {
          console.error("Failed to parse saved progress:", e);
          // Continue without saved progress
        }
      }

      setOnboardingPath(data);
      setOnboardingMode(true);
      setCurrentStep(0);

      // Highlight the learning path on canvas
      if (data.learningPath.length > 0) {
        highlightLearningPath(data.learningPath);
      }
    } catch (err) {
      console.error("Onboarding generation error:", err);
      setOnboardingError(
        err instanceof Error
          ? err.message
          : "Failed to generate onboarding path"
      );
    } finally {
      setIsGeneratingOnboarding(false);
    }
  };

  const markStepComplete = (stepId: string) => {
    if (!onboardingPath) return;

    const updatedPath = {
      ...onboardingPath,
      learningPath: onboardingPath.learningPath.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      ),
    };

    setOnboardingPath(updatedPath);

    // Save progress to localStorage
    const progress: Record<string, boolean> = {};
    updatedPath.learningPath.forEach((step) => {
      if (step.completed) {
        progress[step.id] = true;
      }
    });
    localStorage.setItem(
      `onboarding-${repoFullName}`,
      JSON.stringify(progress)
    );

    // Move to next incomplete step
    const nextIncompleteIndex = updatedPath.learningPath.findIndex(
      (s) =>
        !s.completed &&
        s.order >
          (onboardingPath.learningPath.find((s) => s.id === stepId)?.order || 0)
    );
    if (nextIncompleteIndex !== -1) {
      setCurrentStep(nextIncompleteIndex);
      setExpandedStep(updatedPath.learningPath[nextIncompleteIndex].id);
    }
  };

  const highlightLearningPath = (steps: LearningStep[]) => {
    if (!result) return;

    const learningNodeIds = new Set(steps.map((s) => s.nodeId));

    setNodes((nds) =>
      nds.map((n, index) => {
        const stepForNode = steps.find((s) => s.nodeId === n.id);
        if (stepForNode) {
          return {
            ...n,
            style: {
              border: "3px solid #a78bfa",
              boxShadow: "0 0 30px rgba(167, 139, 250, 0.6)",
            },
            data: {
              ...n.data,
              stepNumber: stepForNode.order,
            },
          };
        }
        return {
          ...n,
          style: {
            opacity: 0.3,
          },
        };
      })
    );
  };

  const exitOnboardingMode = () => {
    setOnboardingMode(false);
    setExpandedStep(null);

    // Reset canvas to normal view
    if (result) {
      const nodeCount = result.blueprint.nodes.length;
      const radius = Math.max(250, nodeCount * 40);
      const centerX = 400;
      const centerY = 300;

      const flowNodes: Node[] = result.blueprint.nodes.map((node, index) => {
        const angle = (index / nodeCount) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: node.id,
          type: "vibeCard",
          position: { x, y },
          data: {
            ...node,
            onClick: () => handleNodeClick(node),
          },
        };
      });

      setNodes(flowNodes);
    }
  };

  // Documentation functions
  const exportDocumentation = async (
    format: "markdown" | "mdx" = "markdown"
  ) => {
    setIsGeneratingDocs(true);
    setDocsError(null);

    try {
      const response = await fetch("/api/documentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate documentation");
      }

      const data = await response.json();

      // Create download
      const blob = new Blob([data.content], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${repo}-architecture.${format === "mdx" ? "mdx" : "md"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("Documentation exported successfully");
    } catch (err) {
      console.error("Documentation export error:", err);
      setDocsError(
        err instanceof Error ? err.message : "Failed to export documentation"
      );
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  // Debt Heatmap functions
  const loadDebtHeatmap = async () => {
    setIsLoadingHeatmap(true);
    setHeatmapError(null);

    try {
      const response = await fetch(
        `/api/debt-heatmap?repo=${encodeURIComponent(repoFullName)}&limit=10`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load heatmap");
      }

      const data = await response.json();
      setHeatmapData(data);
      setShowDebtHeatmap(true);
    } catch (err) {
      console.error("Heatmap error:", err);
      setHeatmapError(
        err instanceof Error ? err.message : "Failed to load heatmap"
      );
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  const clearImpactAnalysis = () => {
    setImpactResult(null);
    setImpactSearchQuery("");
    setShowImpactSearch(false);

    // Reset node styling
    if (result) {
      const nodeCount = result.blueprint.nodes.length;
      const radius = Math.max(250, nodeCount * 40);
      const centerX = 400;
      const centerY = 300;

      const flowNodes: Node[] = result.blueprint.nodes.map((node, index) => {
        const angle = (index / nodeCount) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: node.id,
          type: "vibeCard",
          position: { x, y },
          data: {
            ...node,
            onClick: () => handleNodeClick(node),
          },
        };
      });

      setNodes(flowNodes);

      // Reset edges
      const flowEdges: Edge[] = result.blueprint.edges.map((edge, index) => {
        const getEdgeColor = (edgeType?: string) => {
          switch (edgeType) {
            case "data":
              return "#00d4ff";
            case "control":
              return "#f59e0b";
            case "config":
              return "#a78bfa";
            default:
              return "#00d4ff";
          }
        };

        const color = getEdgeColor(edge.type);

        return {
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: ConnectionLineType.Bezier,
          animated: edge.type === "data",
          style: {
            stroke: color,
            strokeWidth: edge.type === "control" ? 3 : 2,
            strokeDasharray: edge.type === "config" ? "5,5" : undefined,
            filter: `drop-shadow(0 0 8px ${color}66)`,
          },
          labelStyle: {
            fill: color,
            fontSize: 10,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: "#000",
            fillOpacity: 0.9,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: 20,
            height: 20,
          },
          data: { edgeType: edge.type },
        };
      });

      setEdges(flowEdges);
    }
  };

  const handleAnalyze = async () => {
    if (!installationId) {
      setError(
        "GitHub App not connected. Please connect your GitHub account from the dashboard."
      );
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setProgressMessages([]);
    setAnalysisStep("");
    setError(null);
    setResult(null);
    clearImpactAnalysis();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          installationId,
          forceRescan,
        }),
      });

      if (!response.ok) {
        // Handle non-streaming errors (like usage limit or payment required)
        try {
          const errorData = await response.json();
          if (
            errorData.error === "PAYMENT_REQUIRED" ||
            errorData.error === "USAGE_LIMIT_REACHED"
          ) {
            setError(errorData.message);
            if (errorData.usage) {
              setUsageData(errorData.usage);
            }
            if (errorData.requiresPayment) {
              setShowPaywall(true);
            }
            return;
          }
          throw new Error(errorData.error || "Analysis failed");
        } catch (e) {
          // If response isn't JSON, it might be streaming
          if (!response.body) {
            throw new Error("Analysis failed");
          }
        }
      }

      // Handle streaming response
      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "progress") {
                setProgressMessages((prev) => [...prev, data.message]);
                setAnalysisStep(data.step || "");

                // Update progress based on step
                if (data.step === "ingest") setProgress(10);
                else if (data.step?.startsWith("chunk-")) {
                  const chunkNum = parseInt(data.step.split("-")[1]);
                  const totalChunks = data.message.match(/\d+\/(\d+)/)?.[1];
                  if (totalChunks) {
                    const baseProgress = 20;
                    const chunkProgress =
                      (chunkNum / parseInt(totalChunks)) * 50;
                    setProgress(baseProgress + chunkProgress);
                  }
                } else if (data.step === "synthesize") setProgress(75);
                else if (data.step === "validate") setProgress(85);
                else if (data.step === "drift") setProgress(90);
                else if (data.step === "cache") setProgress(95);
                else if (data.step === "complete") setProgress(100);
              } else if (data.type === "complete") {
                setResult({
                  blueprint: data.blueprint,
                  analyzedAt: data.analyzedAt,
                  cached: data.cached,
                  drift: data.drift,
                });
                setProgress(100);
                setForceRescan(false);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Failed to parse progress update:", e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "text-red-500 border-red-500/30 bg-red-500/10";
      case "Med":
        return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
      case "Low":
        return "text-green-500 border-green-500/30 bg-green-500/10";
      default:
        return "text-gray-500 border-gray-500/30 bg-gray-500/10";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "High":
        return <AlertTriangle className="w-4 h-4" />;
      case "Med":
        return <AlertCircle className="w-4 h-4" />;
      case "Low":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Payment handler
  const handleCreateCheckout = async () => {
    setIsCreatingCheckout(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/action/payment-success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout");
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Dodo Payments hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Failed to start payment"
      );
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ANALYZING...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{result ? "REANALYZE" : "START ANALYSIS"}</span>
              </>
            )}
          </Button>

          {result && !isAnalyzing && (
            <>
              <Button
                onClick={generateOnboardingPath}
                disabled={isGeneratingOnboarding}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10 font-mono gap-2 text-purple-400"
              >
                {isGeneratingOnboarding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Onboarding</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowImpactSearch(!showImpactSearch)}
                variant="outline"
                className="border-emerald-500/50 hover:bg-emerald-500/10 font-mono gap-2 text-emerald-400"
              >
                <Target className="w-4 h-4" />
                Impact Analysis
              </Button>

              <Button
                onClick={() => exportDocumentation("markdown")}
                disabled={isGeneratingDocs}
                variant="outline"
                className="border-blue-500/50 hover:bg-blue-500/10 font-mono gap-2 text-blue-400"
              >
                {isGeneratingDocs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Export Docs</span>
                  </>
                )}
              </Button>

              <Button
                onClick={loadDebtHeatmap}
                disabled={isLoadingHeatmap}
                variant="outline"
                className="border-red-500/50 hover:bg-red-500/10 font-mono gap-2 text-red-400"
              >
                {isLoadingHeatmap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Debt Heatmap</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => {
                  setForceRescan(true);
                  setTimeout(() => handleAnalyze(), 100);
                }}
                variant="outline"
                className="border-primary/50 hover:bg-primary/10 font-mono gap-2"
              >
                <Terminal className="w-4 h-4" />
                Force Rescan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Impact Analysis Search Bar */}
      {showImpactSearch && result && (
        <div className="glass-card border border-emerald-500/30 bg-emerald-500/5 p-6 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-mono font-bold text-emerald-400 mb-2">
                  IMPACT ANALYSIS ENGINE
                </h3>
                <p className="text-sm text-gray-400 mb-4 font-mono">
                  Enter a file path to see which features will be affected by
                  changes
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={impactSearchQuery}
                      onChange={(e) => setImpactSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleImpactAnalysis();
                        }
                      }}
                      placeholder="e.g., app/auth/actions.ts or components/Button.tsx"
                      className="w-full bg-black border border-emerald-500/30 rounded-lg px-10 py-3 font-mono text-sm text-foreground placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <Button
                    onClick={handleImpactAnalysis}
                    disabled={isAnalyzingImpact}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold font-mono gap-2"
                  >
                    {isAnalyzingImpact ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ANALYZING...</span>
                      </>
                    ) : (
                      <>
                        <Waves className="w-4 h-4" />
                        <span>ANALYZE IMPACT</span>
                      </>
                    )}
                  </Button>
                  {impactResult && (
                    <Button
                      onClick={clearImpactAnalysis}
                      variant="outline"
                      className="border-gray-500/50 hover:bg-gray-500/10 font-mono"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {impactError && (
                  <div className="mt-3 text-sm font-mono text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {impactError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress Display */}
      {isAnalyzing && (
        <div className="glass-card border border-primary/30 p-6 animate-fade-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-mono text-primary font-semibold">
                  BLUEPRINT ORCHESTRATOR RUNNING...
                </span>
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Comprehensive Mode Indicator */}
            {analysisStep === "comprehensive" && (
              <p className="text-cyan-400 text-xs font-mono mb-2">
                🔍 COMPREHENSIVE MODE: Full-depth multi-pass analysis
              </p>
            )}

            {/* Real-time Progress Messages - Thinking Style */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progressMessages.length > 0 ? (
                progressMessages.map((message, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm font-mono text-gray-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-primary mt-1">▸</span>
                    <span className="flex-1">{message}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing analysis...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-card border border-primary/50 bg-black p-8 max-w-md w-full space-y-6 animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-foreground mb-2">
                Unlock Full Access
              </h2>
              <p className="text-sm text-muted-foreground font-mono mb-4">
                {error ||
                  "Complete a one-time payment to unlock 5 repository scans."}
              </p>
            </div>

            <div className="glass-card border border-primary/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-foreground">
                  One-time Payment
                </span>
                <span className="font-mono font-bold text-primary text-xl">
                  $14.99
                </span>
              </div>
              <div className="border-t border-primary/10 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>5 repository scans included</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Secure payment via Dodo Payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No recurring charges</span>
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="glass-card border border-destructive/30 p-4 bg-destructive/5">
                <p className="text-sm font-mono text-destructive">
                  {paymentError}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaywall(false)}
                className="flex-1 font-mono"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCheckout}
                disabled={isCreatingCheckout}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold font-mono gap-2"
              >
                {isCreatingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Pay $14.99</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center font-mono text-muted-foreground">
              You&apos;ll be redirected to Dodo Payments secure checkout
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !showPaywall && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                ANALYSIS FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Error State */}
      {onboardingError && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                ONBOARDING GENERATION FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">
                {onboardingError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Error State */}
      {docsError && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <FileDown className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                DOCUMENTATION EXPORT FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">
                {docsError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Debt Heatmap */}
      {showDebtHeatmap && heatmapData && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Header */}
          <div className="glass-card border border-red-500/50 bg-red-500/10 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-mono font-bold text-red-400 mb-2 flex items-center gap-2">
                  <Activity className="w-7 h-7" />
                  TECHNICAL DEBT HEATMAP
                </h3>
                <p className="text-sm font-mono text-gray-300">
                  Time-series analysis of risk levels across{" "}
                  {heatmapData.summary.totalScans} scans
                </p>
              </div>
              <Button
                onClick={() => setShowDebtHeatmap(false)}
                variant="outline"
                className="border-red-500/50 hover:bg-red-500/10 font-mono"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Overall Trend Summary */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="glass-card border border-gray-700 p-4">
                <p className="text-xs font-mono text-gray-400 mb-1">
                  Overall Trend
                </p>
                <div className="flex items-center gap-2">
                  {heatmapData.summary.overallTrend === "improving" ? (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  ) : heatmapData.summary.overallTrend === "degrading" ? (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-yellow-400" />
                  )}
                  <span
                    className={`text-lg font-mono font-bold ${
                      heatmapData.summary.overallTrend === "improving"
                        ? "text-green-400"
                        : heatmapData.summary.overallTrend === "degrading"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {heatmapData.summary.overallTrend.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="glass-card border border-gray-700 p-4">
                <p className="text-xs font-mono text-gray-400 mb-1">
                  Risk Score Delta
                </p>
                <div className="flex items-center gap-2">
                  {heatmapData.summary.riskScoreDelta > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  )}
                  <span
                    className={`text-lg font-mono font-bold ${
                      heatmapData.summary.riskScoreDelta > 0
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {heatmapData.summary.riskScoreDelta > 0 ? "+" : ""}
                    {heatmapData.summary.riskScoreDelta}
                  </span>
                </div>
              </div>

              <div className="glass-card border border-gray-700 p-4">
                <p className="text-xs font-mono text-gray-400 mb-1">
                  High Risk Added
                </p>
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-red-400" />
                  <span className="text-lg font-mono font-bold text-red-400">
                    {heatmapData.summary.highRiskAdded}
                  </span>
                </div>
              </div>

              <div className="glass-card border border-gray-700 p-4">
                <p className="text-xs font-mono text-gray-400 mb-1">
                  High Risk Removed
                </p>
                <div className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-green-400" />
                  <span className="text-lg font-mono font-bold text-green-400">
                    {heatmapData.summary.highRiskRemoved}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Score Timeline */}
          <div className="glass-card border border-red-500/30 p-6">
            <h4 className="text-lg font-mono font-bold text-red-400 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              RISK SCORE TIMELINE
            </h4>

            <div className="relative h-48 border border-gray-700 rounded bg-black/50 p-4">
              {/* Timeline visualization */}
              <div className="flex items-end justify-between h-full gap-2">
                {heatmapData.snapshots
                  .slice()
                  .reverse()
                  .map((snapshot: any, index: number) => {
                    const height = `${snapshot.riskScore}%`;
                    const date = new Date(
                      snapshot.analyzedAt
                    ).toLocaleDateString();
                    const isLatest = index === heatmapData.snapshots.length - 1;

                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            snapshot.riskScore > 70
                              ? "bg-red-500"
                              : snapshot.riskScore > 40
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          } ${isLatest ? "ring-2 ring-cyan-400" : ""}`}
                          style={{ height }}
                          title={`Risk Score: ${snapshot.riskScore}`}
                        />
                        <span className="text-[10px] font-mono text-gray-400 rotate-45 origin-top-left">
                          {date}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-gray-500">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
            </div>
          </div>

          {/* Risk Trends by Feature */}
          <div className="glass-card border border-red-500/30 p-6">
            <h4 className="text-lg font-mono font-bold text-red-400 mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              FEATURE RISK TRENDS
            </h4>

            <div className="space-y-2">
              {heatmapData.trends.slice(0, 10).map((trend: any) => {
                const getTrendColor = () => {
                  if (trend.trend === "increasing")
                    return "text-red-400 bg-red-500/10 border-red-500/30";
                  if (trend.trend === "decreasing")
                    return "text-green-400 bg-green-500/10 border-green-500/30";
                  if (trend.trend === "new")
                    return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
                  return "text-gray-400 bg-gray-500/10 border-gray-500/30";
                };

                const getTrendIcon = () => {
                  if (trend.trend === "increasing")
                    return <TrendingUp className="w-4 h-4" />;
                  if (trend.trend === "decreasing")
                    return <TrendingDown className="w-4 h-4" />;
                  if (trend.trend === "new")
                    return <Plus className="w-4 h-4" />;
                  return <Minus className="w-4 h-4" />;
                };

                return (
                  <div
                    key={trend.nodeId}
                    className={`glass-card border p-4 hover:bg-opacity-20 transition-all ${getTrendColor()}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTrendIcon()}
                          <h5 className="font-mono font-bold">
                            {trend.nodeLabel}
                          </h5>
                          <span className="text-xs font-mono px-2 py-0.5 rounded border">
                            {trend.trend.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-mono">
                          {trend.previousRisk && (
                            <>
                              <span className="text-gray-400">
                                Was:{" "}
                                <span
                                  className={getRiskColor(trend.previousRisk)}
                                >
                                  {trend.previousRisk}
                                </span>
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                            </>
                          )}
                          <span className="text-gray-400">
                            Now:{" "}
                            <span className={getRiskColor(trend.currentRisk)}>
                              {trend.currentRisk}
                            </span>
                          </span>
                        </div>

                        {/* Mini timeline */}
                        <div className="mt-2 flex gap-1">
                          {trend.snapshots
                            .slice(0, 5)
                            .reverse()
                            .map((snap: any, i: number) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-sm ${
                                  snap.risk === "High"
                                    ? "bg-red-500"
                                    : snap.risk === "Med"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                title={`${snap.risk} - ${new Date(
                                  snap.date
                                ).toLocaleDateString()}`}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most Improved / Most Degraded */}
          {(heatmapData.summary.mostImprovedNodes.length > 0 ||
            heatmapData.summary.mostDegradedNodes.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {heatmapData.summary.mostImprovedNodes.length > 0 && (
                <div className="glass-card border border-green-500/30 bg-green-500/5 p-6">
                  <h4 className="text-lg font-mono font-bold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    MOST IMPROVED
                  </h4>
                  <ul className="space-y-2">
                    {heatmapData.summary.mostImprovedNodes.map(
                      (node: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm font-mono text-green-300 flex items-center gap-2"
                        >
                          <TrendingDown className="w-4 h-4 flex-shrink-0" />
                          {node}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {heatmapData.summary.mostDegradedNodes.length > 0 && (
                <div className="glass-card border border-red-500/30 bg-red-500/5 p-6">
                  <h4 className="text-lg font-mono font-bold text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    MOST DEGRADED
                  </h4>
                  <ul className="space-y-2">
                    {heatmapData.summary.mostDegradedNodes.map(
                      (node: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm font-mono text-red-300 flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4 flex-shrink-0" />
                          {node}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Heatmap Error State */}
      {heatmapError && (
        <div className="glass-card border border-destructive/30 p-6 bg-destructive/5 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-semibold text-destructive mb-1">
                HEATMAP LOAD FAILED
              </h3>
              <p className="text-sm font-mono text-destructive/80">
                {heatmapError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Cache State */}
      {isLoadingCache && !result && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Checking for cached blueprint...
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Loading previous analysis if available
          </p>
        </div>
      )}

      {/* React Flow Canvas */}
      {result && !isAnalyzing && (
        <div className="space-y-4">
          {/* Cache Info Banner */}
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
                      ? `Showing cached blueprint from ${formatDate(
                          result.analyzedAt
                        )}`
                      : "Fresh blueprint generated"}
                  </span>
                </div>
                {result.cached && (
                  <span className="text-xs font-mono text-muted-foreground">
                    Click &quot;Force Rescan&quot; to check for drift
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Architectural Drift Alert */}
          {result.drift && (
            <div className="glass-card border border-yellow-500/30 bg-yellow-500/5 p-6 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <GitBranch className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-mono font-bold text-yellow-500 mb-2">
                    ARCHITECTURAL DRIFT DETECTED
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Major changes detected since last scan
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.drift.addedNodes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-500" />
                        <span className="font-mono text-sm text-foreground">
                          {result.drift.addedNodes.length} New Features
                        </span>
                      </div>
                    )}
                    {result.drift.removedNodes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-red-500" />
                        <span className="font-mono text-sm text-foreground">
                          {result.drift.removedNodes.length} Removed Features
                        </span>
                      </div>
                    )}
                    {result.drift.riskChanges.length > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono text-sm text-foreground">
                          {result.drift.riskChanges.length} Risk Changes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visual Canvas Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-mono font-bold text-cyan-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              BUSINESS LOGIC BLUEPRINT
              <span className="text-sm text-gray-500 font-normal">
                ({result.blueprint.nodes.length} features,{" "}
                {result.blueprint.edges.length} connections)
              </span>
            </h2>
          </div>

          {/* React Flow Canvas */}
          <div className="relative h-[700px] w-full bg-black border-2 border-cyan-500/20 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,212,255,0.2)]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.Bezier}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                animated: true,
                style: {
                  stroke: "#00d4ff",
                  strokeWidth: 2,
                },
              }}
              className="bg-black"
            >
              <Background
                color="#00d4ff"
                gap={20}
                size={1}
                style={{ opacity: 0.1 }}
              />
              <Controls className="bg-black border border-cyan-500/30 rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.2)]" />
            </ReactFlow>

            {/* Instruction overlay */}
            <div className="absolute top-4 left-4 bg-black/80 border border-cyan-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
              <p className="text-xs font-mono text-cyan-400">
                Click any node to view details
              </p>
            </div>

            {/* Edge type legend */}
            <div className="absolute bottom-4 right-4 bg-black/90 border border-cyan-500/30 rounded-lg px-4 py-3 backdrop-blur-sm">
              <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
                Connection Types
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-cyan-400 shadow-[0_0_4px_rgba(0,212,255,0.6)]" />
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-cyan-400">
                    Data Flow
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[3px] bg-orange-400 shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                  <Settings className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] font-mono text-orange-400">
                    Control Flow
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t border-dashed border-purple-400 shadow-[0_0_4px_rgba(167,139,250,0.6)]" />
                  <FileCode className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-mono text-purple-400">
                    Config
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Analysis Results Panel */}
          {impactResult && (
            <div className="mt-6 space-y-4 animate-fade-in-up">
              {/* Risk Score Header */}
              <div
                className={`glass-card border p-6 ${
                  impactResult.riskLevel === "Critical"
                    ? "border-red-500/50 bg-red-500/10"
                    : impactResult.riskLevel === "High"
                    ? "border-orange-500/50 bg-orange-500/10"
                    : impactResult.riskLevel === "Medium"
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-green-500/50 bg-green-500/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-mono font-bold text-foreground mb-2 flex items-center gap-2">
                      <Waves className="w-6 h-6 text-emerald-400" />
                      IMPACT ANALYSIS: {impactResult.targetFile}
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-mono text-muted-foreground">
                        Risk Score:{" "}
                        <span className="text-2xl font-bold text-foreground">
                          {impactResult.riskScore}
                        </span>
                        /100
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg border text-sm font-mono font-bold ${
                          impactResult.riskLevel === "Critical"
                            ? "text-red-400 border-red-400/30 bg-red-400/20"
                            : impactResult.riskLevel === "High"
                            ? "text-orange-400 border-orange-400/30 bg-orange-400/20"
                            : impactResult.riskLevel === "Medium"
                            ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/20"
                            : "text-green-400 border-green-400/30 bg-green-400/20"
                        }`}
                      >
                        {impactResult.riskLevel.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected Features Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {impactResult.directlyAffectedNodes.length > 0 && (
                  <div className="glass-card border border-red-500/30 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h4 className="font-mono font-bold text-red-400">
                        DIRECT IMPACT
                      </h4>
                    </div>
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {impactResult.directlyAffectedNodes.length}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      features contain this file
                    </p>
                  </div>
                )}

                {impactResult.indirectlyAffectedNodes.length > 0 && (
                  <div className="glass-card border border-orange-500/30 bg-orange-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-5 h-5 text-orange-400" />
                      <h4 className="font-mono font-bold text-orange-400">
                        INDIRECT IMPACT
                      </h4>
                    </div>
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {impactResult.indirectlyAffectedNodes.length}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      connected features
                    </p>
                  </div>
                )}

                {impactResult.downstreamNodes.length > 0 && (
                  <div className="glass-card border border-yellow-500/30 bg-yellow-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-yellow-400" />
                      <h4 className="font-mono font-bold text-yellow-400">
                        DOWNSTREAM
                      </h4>
                    </div>
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {impactResult.downstreamNodes.length}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      downstream dependencies
                    </p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {impactResult.recommendations.length > 0 && (
                <div className="glass-card border border-cyan-500/20 p-6">
                  <h4 className="font-mono font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    RECOMMENDATIONS
                  </h4>
                  <div className="space-y-2">
                    {impactResult.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="text-sm font-mono text-gray-300 flex items-start gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-cyan-500/10"
                      >
                        <span className="text-cyan-400 flex-shrink-0">→</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Features Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {impactResult.directlyAffectedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="glass-card border border-red-500/30 p-4 hover:border-red-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const originalNode = result?.blueprint.nodes.find(
                        (n) => n.id === node.id
                      );
                      if (originalNode) {
                        setSelectedNode(originalNode);
                        setSidePanelOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-mono font-semibold text-red-400">
                        {node.label}
                      </h5>
                      <span className="text-[10px] font-mono font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
                        DIRECT
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-2">
                      {node.reason}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                ))}

                {impactResult.indirectlyAffectedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="glass-card border border-orange-500/30 p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => {
                      const originalNode = result?.blueprint.nodes.find(
                        (n) => n.id === node.id
                      );
                      if (originalNode) {
                        setSelectedNode(originalNode);
                        setSidePanelOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-mono font-semibold text-orange-400">
                        {node.label}
                      </h5>
                      <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                        INDIRECT
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-2">
                      {node.reason}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Learning Path */}
          {onboardingMode && onboardingPath && onboardingPath.learningPath && (
            <div className="mt-6 space-y-4 animate-fade-in-up">
              {/* Header */}
              <div className="glass-card border border-purple-500/50 bg-purple-500/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-mono font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <GraduationCap className="w-7 h-7" />
                      DEVELOPER ONBOARDING PATH
                    </h3>
                    <p className="text-sm font-mono text-gray-300 leading-relaxed">
                      {onboardingPath.overview}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (onboardingPath) {
                          exportOnboardingToPDF(repoFullName, onboardingPath);
                        }
                      }}
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/10 font-mono gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </Button>
                    <Button
                      onClick={exitOnboardingMode}
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/10 font-mono"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {onboardingPath.totalSteps}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      Total Steps
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-foreground">
                      {Math.floor(onboardingPath.estimatedTotalTime / 60)}h{" "}
                      {onboardingPath.estimatedTotalTime % 60}m
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      Estimated Time
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-purple-400">
                      {onboardingPath.learningPath?.filter((s) => s.completed)
                        .length || 0}
                      /{onboardingPath.totalSteps}
                    </p>
                    <p className="text-xs font-mono text-gray-400">Completed</p>
                  </div>
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="glass-card border border-purple-500/20 p-6">
                <h4 className="font-mono font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  KEY TAKEAWAYS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {onboardingPath.keyTakeaways.map((takeaway, i) => (
                    <div
                      key={i}
                      className="text-sm font-mono text-gray-300 flex items-start gap-2 bg-purple-950/30 px-3 py-2 rounded border border-purple-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Steps */}
              <div className="space-y-3">
                {onboardingPath.learningPath.map((step, index) => {
                  const isExpanded = expandedStep === step.id;
                  const isCompleted = step.completed || false;
                  const isCurrent = index === currentStep;

                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case "read":
                        return "text-blue-400 border-blue-400/30 bg-blue-400/10";
                      case "explore":
                        return "text-cyan-400 border-cyan-400/30 bg-cyan-400/10";
                      case "modify":
                        return "text-orange-400 border-orange-400/30 bg-orange-400/10";
                      case "test":
                        return "text-green-400 border-green-400/30 bg-green-400/10";
                      default:
                        return "text-gray-400 border-gray-400/30 bg-gray-400/10";
                    }
                  };

                  const getTypeIcon = (type: string) => {
                    switch (type) {
                      case "read":
                        return <BookOpen className="w-4 h-4" />;
                      case "explore":
                        return <Search className="w-4 h-4" />;
                      case "modify":
                        return <FileCode className="w-4 h-4" />;
                      case "test":
                        return <Play className="w-4 h-4" />;
                      default:
                        return null;
                    }
                  };

                  return (
                    <div
                      key={step.id}
                      className={`glass-card border p-4 transition-all duration-300 ${
                        isCompleted
                          ? "border-green-500/30 bg-green-500/5"
                          : isCurrent
                          ? "border-purple-500/50 bg-purple-500/10"
                          : "border-purple-500/20"
                      }`}
                    >
                      {/* Step Header */}
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedStep(isExpanded ? null : step.id)
                        }
                      >
                        <div className="flex items-start gap-4 flex-1">
                          {/* Step Number */}
                          <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono font-bold flex-shrink-0 ${
                              isCompleted
                                ? "border-green-500 bg-green-500/20 text-green-400"
                                : isCurrent
                                ? "border-purple-500 bg-purple-500/20 text-purple-400 animate-pulse"
                                : "border-gray-600 bg-gray-900 text-gray-500"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              step.order
                            )}
                          </div>

                          {/* Step Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-mono font-bold text-foreground">
                                {step.title}
                              </h5>
                              <div
                                className={`px-2 py-1 rounded border text-[10px] font-mono font-semibold flex items-center gap-1 ${getTypeColor(
                                  step.type
                                )}`}
                              >
                                {getTypeIcon(step.type)}
                                {step.type.toUpperCase()}
                              </div>
                              <div className="px-2 py-1 rounded border border-gray-600/30 bg-gray-900/50 text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.estimatedTime}min
                              </div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {step.description}
                            </p>
                            <p className="text-xs font-mono text-purple-400 mt-1">
                              Feature: {step.nodeName}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 animate-fade-in-up">
                          {/* Files */}
                          <div>
                            <h6 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <FileCode className="w-4 h-4" />
                              Files to Study ({step.files.length})
                            </h6>
                            <div className="space-y-1">
                              {step.files.map((file, i) => (
                                <div
                                  key={i}
                                  className="bg-zinc-900/50 border border-cyan-500/10 rounded px-3 py-2 text-sm font-mono text-cyan-300"
                                >
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Objectives */}
                          <div>
                            <h6 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Learning Objectives
                            </h6>
                            <div className="space-y-1">
                              {step.objectives.map((obj, i) => (
                                <div
                                  key={i}
                                  className="text-sm font-mono text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-emerald-400 flex-shrink-0">
                                    →
                                  </span>
                                  <span>{obj}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Checkpoints */}
                          <div>
                            <h6 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Checkpoints
                            </h6>
                            <div className="space-y-1">
                              {step.checkpoints.map((checkpoint, i) => (
                                <div
                                  key={i}
                                  className="text-sm font-mono text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-yellow-400 flex-shrink-0">
                                    ☐
                                  </span>
                                  <span>{checkpoint}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Hints */}
                          {step.hints.length > 0 && (
                            <div>
                              <h6 className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Hints
                              </h6>
                              <div className="space-y-1">
                                {step.hints.map((hint, i) => (
                                  <div
                                    key={i}
                                    className="text-sm font-mono text-gray-300 flex items-start gap-2 bg-orange-950/30 px-3 py-2 rounded border border-orange-500/10"
                                  >
                                    <Lightbulb className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <span>{hint}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mark Complete Button */}
                          {!isCompleted && (
                            <Button
                              onClick={() => markStepComplete(step.id)}
                              className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-black font-semibold font-mono gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark as Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side Panel */}
      {sidePanelOpen && selectedNode && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => setSidePanelOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-black border-l-2 border-cyan-500/30 shadow-[-20px_0_60px_rgba(0,212,255,0.2)] animate-slide-in-right overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black border-b border-cyan-500/30 p-6 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-mono font-bold text-cyan-400 mb-2">
                    {selectedNode.label}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`px-2 py-1 rounded border text-xs font-mono font-semibold flex items-center gap-1 ${
                        selectedNode.risk === "High"
                          ? "text-red-500 border-red-500/30 bg-red-500/10"
                          : selectedNode.risk === "Med"
                          ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
                          : "text-green-500 border-green-500/30 bg-green-500/10"
                      }`}
                    >
                      {selectedNode.risk === "High" && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {selectedNode.risk === "Med" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {selectedNode.risk === "Low" && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {selectedNode.risk} Risk
                    </div>
                    {selectedNode.vibe && (
                      <div
                        className={`px-2 py-1 rounded border text-xs font-mono font-semibold flex items-center gap-1 ${
                          selectedNode.vibe === "stable"
                            ? "text-blue-400 border-blue-400/30 bg-blue-400/10"
                            : selectedNode.vibe === "active"
                            ? "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"
                            : selectedNode.vibe === "fragile"
                            ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                            : "text-purple-400 border-purple-400/30 bg-purple-400/10"
                        }`}
                      >
                        {selectedNode.vibe === "stable" && (
                          <Anchor className="w-3 h-3" />
                        )}
                        {selectedNode.vibe === "active" && (
                          <Activity className="w-3 h-3" />
                        )}
                        {selectedNode.vibe === "fragile" && (
                          <Flame className="w-3 h-3" />
                        )}
                        {selectedNode.vibe === "boilerplate" && (
                          <Copy className="w-3 h-3" />
                        )}
                        {selectedNode.vibe}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidePanelOpen(false)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Vibe Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Vibe Description
                </h3>
                <p className="text-base text-gray-300 leading-relaxed font-mono border-l-2 border-cyan-500/30 pl-4">
                  {selectedNode.description}
                </p>
              </div>

              {/* Entry Points */}
              {selectedNode.entryPoints &&
                selectedNode.entryPoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Where to Start ({selectedNode.entryPoints.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedNode.entryPoints.map((entryPoint, i) => (
                        <div
                          key={i}
                          className="bg-emerald-950/30 border border-emerald-500/20 rounded px-3 py-2 hover:border-emerald-500/40 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                            <code className="text-sm font-mono text-emerald-300 break-all">
                              {entryPoint}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Conventions */}
              {selectedNode.conventions &&
                selectedNode.conventions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Key Conventions ({selectedNode.conventions.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedNode.conventions.map((convention, i) => (
                        <div
                          key={i}
                          className="bg-purple-950/30 border border-purple-500/20 rounded px-3 py-2 hover:border-purple-500/40 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-mono text-purple-200 leading-relaxed">
                              {convention}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Critical Files */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Critical Files ({selectedNode.files.length})
                </h3>
                <div className="space-y-2">
                  {selectedNode.files.map((file, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900/50 border border-cyan-500/10 rounded px-3 py-2 hover:border-cyan-500/30 transition-colors"
                    >
                      <code className="text-sm font-mono text-cyan-300">
                        {file}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections */}
              {selectedNode &&
                result &&
                result.blueprint.edges.filter(
                  (e) =>
                    e.source === selectedNode.id || e.target === selectedNode.id
                ).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      Connections
                    </h3>
                    <div className="space-y-2">
                      {result.blueprint.edges
                        .filter(
                          (e) =>
                            selectedNode &&
                            (e.source === selectedNode.id ||
                              e.target === selectedNode.id)
                        )
                        .map((edge, i) => {
                          const connectedNode = result.blueprint.nodes.find(
                            (n) =>
                              selectedNode &&
                              n.id ===
                                (edge.source === selectedNode.id
                                  ? edge.target
                                  : edge.source)
                          );
                          const isOutgoing = edge.source === selectedNode.id;

                          const getEdgeTypeIcon = (edgeType?: string) => {
                            switch (edgeType) {
                              case "data":
                                return (
                                  <Database className="w-3 h-3 text-cyan-400" />
                                );
                              case "control":
                                return (
                                  <Settings className="w-3 h-3 text-orange-400" />
                                );
                              case "config":
                                return (
                                  <FileCode className="w-3 h-3 text-purple-400" />
                                );
                              default:
                                return (
                                  <GitBranch className="w-3 h-3 text-gray-400" />
                                );
                            }
                          };

                          const getEdgeTypeBorder = (edgeType?: string) => {
                            switch (edgeType) {
                              case "data":
                                return "border-cyan-500/20 hover:border-cyan-500/40";
                              case "control":
                                return "border-orange-500/20 hover:border-orange-500/40";
                              case "config":
                                return "border-purple-500/20 hover:border-purple-500/40";
                              default:
                                return "border-cyan-500/10 hover:border-cyan-500/30";
                            }
                          };

                          return (
                            <div
                              key={i}
                              className={`bg-zinc-900/50 border rounded p-3 transition-colors ${getEdgeTypeBorder(
                                edge.type
                              )}`}
                            >
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-cyan-400 font-mono text-xs font-semibold">
                                  {isOutgoing ? "→ OUTGOING" : "← INCOMING"}
                                </span>
                                {edge.type && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 border border-current/20">
                                    {getEdgeTypeIcon(edge.type)}
                                    <span
                                      className={`text-[10px] font-mono font-semibold uppercase ${
                                        edge.type === "data"
                                          ? "text-cyan-400"
                                          : edge.type === "control"
                                          ? "text-orange-400"
                                          : "text-purple-400"
                                      }`}
                                    >
                                      {edge.type}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-mono text-gray-200 font-semibold mb-1">
                                {connectedNode?.label}
                              </div>
                              <div className="text-xs font-mono text-gray-400 leading-relaxed">
                                {edge.label}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Risk Analysis */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Analysis
                </h3>
                <div
                  className={`border rounded p-4 ${
                    selectedNode.risk === "High"
                      ? "border-red-500/30 bg-red-500/5"
                      : selectedNode.risk === "Med"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-green-500/30 bg-green-500/5"
                  }`}
                >
                  <p className="text-sm font-mono text-gray-300">
                    {selectedNode.risk === "High" &&
                      "This feature has high complexity or technical debt. Consider refactoring or close monitoring."}
                    {selectedNode.risk === "Med" &&
                      "This feature has moderate complexity. Regular maintenance recommended."}
                    {selectedNode.risk === "Low" &&
                      "This feature is well-structured with low technical debt."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && !error && !isLoadingCache && (
        <div className="glass-card border border-primary/20 p-16 text-center">
          <Zap className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-mono font-semibold text-foreground mb-2">
            Ready to Generate Blueprint
          </h3>
          <p className="text-sm font-mono text-muted-foreground max-w-md mx-auto">
            Click &quot;START ANALYSIS&quot; to extract the business logic
            structure from this repository. The Blueprint Orchestrator will
            identify features, map connections, and assess risk levels.
          </p>
        </div>
      )}
    </div>
  );
}
