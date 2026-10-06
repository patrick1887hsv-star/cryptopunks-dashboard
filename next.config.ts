import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable instrumentation hook (for scheduler startup)
// Allow server-side packages that need native binaries
  serverExternalPackages: ["playwright", "node-cron"],
};

export default nextConfig;
