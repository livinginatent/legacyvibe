import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip automatic trailing slash redirect for webhooks
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
