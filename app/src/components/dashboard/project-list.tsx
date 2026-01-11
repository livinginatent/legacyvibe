/**
 * Project List - Table view of all active projects.
 * Displays project status with live indicators and last scan timestamps.
 * Uses monospace typography for technical data display.
 */

"use client";

import { MoreVertical, Eye, Download, Trash2 } from "lucide-react";
import { Button } from "@/app/src/components/ui/button";

// Mock data - would come from API/database in production
const projects = [
  {
    id: 1,
    name: "legacy-e-commerce",
    status: "active",
    lastScanned: "2 hours ago",
    files: 1284,
    issues: 23,
  },
  {
    id: 2,
    name: "monolith-backend",
    status: "active",
    lastScanned: "1 day ago",
    files: 3401,
    issues: 67,
  },
  {
    id: 3,
    name: "old-dashboard",
    status: "scanning",
    lastScanned: "Just now",
    files: 892,
    issues: 12,
  },
  {
    id: 4,
    name: "api-v1-deprecated",
    status: "active",
    lastScanned: "3 days ago",
    files: 567,
    issues: 45,
  },
  {
    id: 5,
    name: "mobile-app-legacy",
    status: "error",
    lastScanned: "5 days ago",
    files: 2103,
    issues: 89,
  },
];

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-500",
    textColor: "text-green-500",
  },
  scanning: {
    label: "Scanning",
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  error: {
    label: "Error",
    color: "bg-red-500",
    textColor: "text-red-500",
  },
};

export function ProjectList() {
  return (
    <div className="glass-card border border-primary/20">
      {/* Header */}
      <div className="p-6 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Projects
            </h2>
            <p className="text-sm font-mono text-muted-foreground">
              {projects.length} active repositories
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-primary/50">
            View All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Last Scanned
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Files
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Issues
              </th>
              <th className="px-6 py-4 text-right text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {projects.map((project) => {
              const status =
                statusConfig[project.status as keyof typeof statusConfig];

              return (
                <tr
                  key={project.id}
                  className="hover:bg-primary/5 transition-colors duration-200 group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-primary/30 bg-primary/10 flex items-center justify-center font-mono text-primary text-xs font-bold">
                        {project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-mono text-foreground font-medium">
                        {project.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${status.color} ${
                          project.status === "active" ? "animate-pulse" : ""
                        } ${
                          project.status === "scanning" ? "animate-ping" : ""
                        }`}
                      />
                      <span
                        className={`font-mono text-sm ${status.textColor} font-semibold`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      {project.lastScanned}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-foreground">
                      {project.files.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                      <span className="font-mono text-sm text-red-500 font-semibold">
                        {project.issues}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-primary/10 flex items-center justify-between">
        <div className="text-sm font-mono text-muted-foreground">
          Showing{" "}
          <span className="text-primary font-semibold">{projects.length}</span>{" "}
          of{" "}
          <span className="text-primary font-semibold">{projects.length}</span>{" "}
          projects
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled
            className="border-primary/30"
          >
            Previous
          </Button>
          <Button size="sm" variant="outline" className="border-primary/50">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
