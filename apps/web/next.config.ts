import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo root (absolute, per docs) — stops Next inferring the wrong
  // workspace root from stray lockfiles higher up the tree.
  turbopack: {
    root: path.join(__dirname, "../.."),
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
