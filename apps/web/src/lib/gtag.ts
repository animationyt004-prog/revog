"use client";

/** Google Ads (gtag.js) helper. No-ops safely until the tag has loaded and a
 *  conversion label is configured. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18327470048";
// The Purchase conversion action's label, from Google Ads → Goals → Conversions
// (the value after the slash in "AW-XXXXXXXXX/AbCdEf..."). Set via env.
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;

/** Report a purchase conversion to Google Ads once per order. */
export function gtagPurchaseOnce(orderNumber: string, value: number): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (!PURCHASE_LABEL) return; // no conversion action configured yet

  const key = `revog:gads:purchase:${orderNumber}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage blocked — still fire, worst case a dup.
  }

  window.gtag("event", "conversion", {
    send_to: `${ADS_ID}/${PURCHASE_LABEL}`,
    value: value / 100, // paise → rupees
    currency: "INR",
    transaction_id: orderNumber,
  });
}
