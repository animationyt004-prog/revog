"use client";

/** Google Ads (gtag.js) helper. No-ops safely until the tag has loaded and a
 *  conversion label is configured. */

import { sendTo } from "./google-ads-config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// The Purchase conversion action, from Google Ads → Goals → Conversions. Set
// this to the whole "AW-XXXXXXXXX/AbCdEf..." from the conversion snippet — a
// bare label is also accepted but then it has to belong to the first account.
const PURCHASE_SEND_TO = sendTo(
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
);

/** Report a purchase conversion to Google Ads once per order. */
export function gtagPurchaseOnce(orderNumber: string, value: number): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (!PURCHASE_SEND_TO) return; // no conversion action configured yet

  const key = `revog:gads:purchase:${orderNumber}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage blocked — still fire, worst case a dup.
  }

  window.gtag("event", "conversion", {
    send_to: PURCHASE_SEND_TO,
    value: value / 100, // paise → rupees
    currency: "INR",
    transaction_id: orderNumber,
  });
}
