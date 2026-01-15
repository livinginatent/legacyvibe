/**
 * Dashboard Layout - Wrapper for all dashboard pages.
 * Provides consistent structure and metadata for the dashboard section.
 * Enforces authentication and sets up shared UI elements.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Cadracode",
  description: "Manage and monitor your legacy code projects",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
