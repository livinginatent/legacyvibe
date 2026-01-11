/**
 * New Project Card - Terminal-style interface for creating new projects.
 * Features a glowing terminal window aesthetic with animated cursor.
 * Primary action for users to start scanning legacy codebases.
 */

"use client";

import { useState } from "react";
import { Button } from "@/app/src/components/ui/button";
import { Plus, Terminal, GitBranch, Upload } from "lucide-react";

export function NewProjectCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative glass-card p-6 border-2 border-primary/30 group-hover:border-primary/50 transition-all duration-300">
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Terminal className="w-6 h-6 text-primary" />
              {isHovered && (
                <div className="absolute inset-0 blur-md bg-primary/50 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                New Project
              </h2>
              <p className="text-sm font-mono text-muted-foreground">
                $ initialize --legacy-scan
              </p>
            </div>
          </div>

          {/* Terminal dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500" />
          </div>
        </div>

        {/* Terminal Content */}
        <div className="bg-black/40 rounded-lg p-6 border border-primary/20 mb-6 font-mono text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-primary">{">"}</span>
              <span className="text-muted-foreground">
                Scan legacy codebase for documentation opportunities
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{">"}</span>
              <span className="text-muted-foreground">
                Generate comprehensive blueprints
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{">"}</span>
              <span className="text-muted-foreground">
                Identify technical debt patterns
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-primary">{">"}</span>
              <span className="text-foreground animate-pulse">_</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            className="flex-1 min-w-[200px] bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-semibold group/btn"
          >
            <Plus className="w-5 h-5 mr-2 group-hover/btn:rotate-90 transition-transform duration-300" />
            Create Project
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
          >
            <GitBranch className="w-5 h-5 mr-2" />
            Import from Git
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-secondary/50 hover:bg-secondary/10"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Files
          </Button>
        </div>

        {/* Scan line animation */}
        {isHovered && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
        )}
      </div>
    </div>
  );
}
