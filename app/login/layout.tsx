/**
 * Login Layout - Wrapper for authentication pages.
 * Sets metadata and ensures proper page structure.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | LegacyVibe",
  description: "Sign in to your LegacyVibe account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
