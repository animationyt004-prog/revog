import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo root (absolute, per docs) — stops Next inferring the wrong
  // workspace root from stray lockfiles higher up the tree. Must point at
  // the real workspace root (not this app's own dir): npm workspaces hoist
  // shared deps like zustand to the root node_modules, and Turbopack won't
  // resolve past whatever directory is declared here.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  images: {
    remotePatterns: [
      // Real product photos live in Cloudflare R2 (public bucket).
      { protocol: "https", hostname: "pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev" },
      // Legacy placeholder shots (kept so old demo data still renders in dev).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
