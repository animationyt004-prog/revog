import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo root — silences multi-lockfile inference warning.
  turbopack: {
    root: "../..",
  },
  images: {
    remotePatterns: [
      // Placeholder product shots (dev only) — replaced by R2 CDN in Phase 5.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
