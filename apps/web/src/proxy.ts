import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** The one canonical host. Everything else is a legacy deploy URL. */
const CANONICAL_HOST = "www.hyrafashions.com";

/** Hosts the store used to live on. Kept reachable purely so old links and
 *  anything Google already indexed lands on the real domain instead of
 *  serving a duplicate copy of the whole storefront. */
const LEGACY_HOSTS = new Set([
  "revog-web.onrender.com",
  "hyra-web-production.up.railway.app",
  "hyrafashions.com",
]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (!LEGACY_HOSTS.has(host)) return NextResponse.next();

  const url = new URL(request.url);
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  url.port = "";

  // 301: permanent, so search engines move ranking to the new domain.
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Skip Next internals and static assets — only page/API traffic needs this.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
