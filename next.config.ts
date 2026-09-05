import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a Node built-in; keep it out of the bundler's hands.
  serverExternalPackages: ["node:sqlite"],
  experimental: {
    // Server Actions carry the whole app's writes; forms stay small.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
