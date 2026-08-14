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

export interface PixelContent {
  id: string;
  quantity: number;
  item_price: number;
}

interface QueuedCall {
  event: string;
  params?: PixelParams;
  eventId?: string;
}

/** The base script loads afterInteractive, so effects on the first render can
 *  run before `fbq` exists. Holding those few calls here is the difference
 *  between reporting a landing page view and losing it. Bounded: if the pixel
 *  is blocked outright, nothing ever flushes and this must not grow. */
const pending: QueuedCall[] = [];
const MAX_PENDING = 20;

function dispatch(call: QueuedCall): void {
  // The fourth argument is what lets Meta collapse this with the matching
  // server-side Conversions API event instead of counting both.
  if (call.eventId) {
    window.fbq!("track", call.event, call.params ?? {}, {
      eventID: call.eventId,
    });
  } else {
    window.fbq!("track", call.event, call.params);
  }
}

/** Send anything that was queued before the base script finished loading. */
export function flushPixelQueue(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  for (const call of pending.splice(0, pending.length)) {
    try {
      dispatch(call);
    } catch {
      // Ad scripts and privacy tools are optional. They must never break buying.
    }
  }
}

export function pixelTrack(
  event: string,
  params?: PixelParams,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") {
    if (pending.length < MAX_PENDING) pending.push({ event, params, eventId });
    return;
  }
  flushPixelQueue();
  try {
    dispatch({ event, params, eventId });
  } catch {
    // Ad scripts and privacy tools are optional. They must never break buying.
  }
}

/**
 * Purchase must be reported once per order, ever.
 *
 * The order page is reachable from the account area long after checkout, so a
 * per-tab guard let the same sale be re-reported on a later visit and inflate
 * ad-reported revenue. localStorage survives that; the event id matches the one
 * the API sends from the payment path, so Meta also collapses the two sides.
 */
export function pixelPurchaseOnce(
  orderNumber: string,
  value: number,
  contents?: PixelContent[],
): void {
  if (typeof window === "undefined") return;
  const key = `revog:pixel:purchase:${orderNumber}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // Storage blocked — still fire; the shared event id below is the backstop.
  }
  pixelTrack(
    "Purchase",
    {
      value: value / 100,
      currency: "INR",
      content_type: "product",
      order_id: orderNumber,
      ...(contents?.length
        ? {
            content_ids: contents.map((content) => content.id),
            contents,
            num_items: contents.reduce(
              (total, content) => total + content.quantity,
              0,
            ),
          }
        : {}),
    },
    `purchase:${orderNumber}`,
  );
}
