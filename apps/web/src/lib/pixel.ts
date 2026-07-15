"use client";

/** Meta (Facebook) Pixel helper. No-ops safely until NEXT_PUBLIC_META_PIXEL_ID
 *  is set and the base script has loaded. */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

type PixelParams = Record<string, unknown>;

export function pixelTrack(event: string, params?: PixelParams): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

/** Purchase must fire once per order — guard against refreshes. */
export function pixelPurchaseOnce(orderNumber: string, value: number): void {
  if (typeof window === "undefined") return;
  const key = `revog:pixel:purchase:${orderNumber}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage blocked — still fire, worst case a dup.
  }
  pixelTrack("Purchase", { value: value / 100, currency: "INR", content_type: "product" });
}
