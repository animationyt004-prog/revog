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
    // Optimisation was off because the free-tier Render box timed out
    // generating variants under a full product grid and left images blank on
    // cold starts. That box is gone; the site runs on Railway now.
    //
    // The originals are not "already web-sized". Measured on the live
    // homepage: 17 files, 2.85 MB, averaging 172 KB at 1086x1448 — for card
    // boxes that render 221x294 CSS px. Resized to the card and re-encoded as
    // WebP the same four sample files drop 86%, taking the homepage from
    // 2.85 MB to roughly 0.40 MB.
    //
    // The ladder below is deliberately short. Every width listed is a variant
    // the server may have to encode, and this catalogue only ever renders
    // product shots into a grid cell, a 50vw product hero, or a thumbnail —
    // the stock ladder's 2048 and 3840 entries would only ever be work.
    qualities: [75],
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [96, 128, 256, 384],
    // R2 filenames carry a content hash, so a re-uploaded photo arrives under
    // a new URL and a long TTL can never serve a stale one.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Real product photos live in Cloudflare R2 (public bucket).
      { protocol: "https", hostname: "pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev" },
      // Legacy placeholder shots (kept so old demo data still renders in dev).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Imported Apple Saree photos are served by the supplier's image CDNs.
      { protocol: "https", hostname: "imgbook.textileexport.in" },
      { protocol: "https", hostname: "textile-export.b-cdn.net" },
      { protocol: "https", hostname: "data.bhawanitextile.com" },
    ],
  },
};

export default nextConfig;
