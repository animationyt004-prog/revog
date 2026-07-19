"use client";

/** First-party funnel tracking. Records events to our own API (for the admin
 *  Traffic dashboard) and mirrors them to GA4 via gtag when configured. */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const SID_COOKIE = "revog_sid";

/** Stable per-browser id in a 1-year cookie — powers unique/returning counts. */
function sessionId(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)revog_sid=([^;]+)/);
  if (m) return m[1];
  const id =
    (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  document.cookie = `${SID_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  return id;
}

export type TrackType = "PAGE_VIEW" | "PRODUCT_VIEW" | "ADD_TO_CART";

export function track(type: TrackType, opts?: { path?: string; productId?: string }): void {
  if (typeof window === "undefined") return;
  const sid = sessionId();
  if (!sid) return;

  const path = opts?.path ?? window.location.pathname;

  // First-party: our admin Traffic dashboard.
  try {
    void fetch(`${API}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, sessionId: sid, path, productId: opts?.productId }),
      keepalive: true, // survive navigation
    }).catch(() => undefined);
  } catch {
    // ignore — analytics must never break the page
  }

  // Mirror to GA4 (gtag) when present.
  const gtag = window.gtag;
  if (typeof gtag === "function") {
    if (type === "PAGE_VIEW") gtag("event", "page_view", { page_path: path });
    else if (type === "PRODUCT_VIEW") gtag("event", "view_item", { item_id: opts?.productId });
    else if (type === "ADD_TO_CART") gtag("event", "add_to_cart", { item_id: opts?.productId });
  }
}
