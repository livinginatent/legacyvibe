/**
 * Dashboard Sidebar - Main navigation for the application.
 * Provides access to Projects, Integrations, and Settings sections.
 * Uses glassmorphism with cyan accent borders for the tech-vibe aesthetic.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderGit2, Plug, Settings, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Projects",
    href: "/dashboard",
    icon: FolderGit2,
  },
  {
    name: "Integrations",
    href: "/dashboard/integrations",
    icon: Plug,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-primary/20 glass flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary/10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Code2 className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/30 rounded-full" />
          </div>
          <div>
            <span className="text-xl font-bold text-foreground">
              Legacy<span className="text-primary">Vibe</span>
            </span>
            <p className="text-xs font-mono text-muted-foreground">v1.0.0</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-primary/10 border border-primary/50 text-primary shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
              )}

              <Icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110",
                  isActive && "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                )}
              />
              <span className="font-medium relative z-10">{item.name}</span>

              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/10">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">
              System Online
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground/70">
            Last sync: 2 min ago
          </div>
        </div>
      </div>
    </aside>
  );
}
