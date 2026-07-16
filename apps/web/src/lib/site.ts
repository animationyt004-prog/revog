/** Canonical site origin used for SEO (sitemap, robots, JSON-LD, OG).
 *  Set NEXT_PUBLIC_SITE_URL to the custom domain once live. The fallback is
 *  the deployed URL — NEVER localhost, which would poison the search index. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://revog-web.onrender.com";

export const SITE_NAME = "REVOG";
