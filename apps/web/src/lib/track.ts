"use client";

import { pixelTrack } from "./pixel";

/** First-party funnel tracking. One call fires all three destinations for an
 *  event: our own API (admin Traffic dashboard + the Meta Conversions API
 *  behind it), the Meta Pixel in the browser, and GA4 via gtag.
 *
 *  Browser and server are deliberately driven from the same place: both sides
 *  have to carry the same event id or Meta counts the event twice. */

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

export type TrackType =
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "ADD_TO_CART"
  | "INITIATE_CHECKOUT"
  | "ADD_PAYMENT_INFO"
  | "LEAD";

const META_EVENT: Record<TrackType, string> = {
  PAGE_VIEW: "PageView",
  PRODUCT_VIEW: "ViewContent",
  ADD_TO_CART: "AddToCart",
  INITIATE_CHECKOUT: "InitiateCheckout",
  ADD_PAYMENT_INFO: "AddPaymentInfo",
  LEAD: "Lead",
};

interface TrackOptions {
  path?: string;
  /** Our product id — addresses rows in the admin Traffic dashboard. */
  productId?: string;
  /** Variant SKU — the id published as g:id in the product feed. */
  contentId?: string;
  contentIds?: string[];
  contentName?: string;
  /** Rupees, not paise. */
  value?: number;
  /** ADD_PAYMENT_INFO only: which tender the shopper picked. */
  paymentMethod?: "online" | "cod";
}

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const META_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

function setMetaCookie(name: "_fbp" | "_fbc", value: string): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${META_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

/** Preserve Meta's browser and click identifiers before the async Pixel script
 *  gets a chance to create its own cookies. Existing values always win.
 *
 *  Exported because checkout has to hand these to the API as well: the sale is
 *  reported server-side long after the tab is gone, and these ids are the only
 *  thing tying it back to the ad click. */
export function metaAttribution(): { fbp?: string; fbc?: string } {
  let fbp = cookie("_fbp");
  let fbc = cookie("_fbc");
  const now = Date.now();

  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search)
      .get("fbclid")
      ?.trim();
    if (fbclid && /^[A-Za-z0-9._-]{5,500}$/.test(fbclid)) {
      fbc = `fb.1.${now}.${fbclid}`;
      setMetaCookie("_fbc", fbc);
    }
  }

  if (!fbp) {
    const random = Math.floor(Math.random() * 10_000_000_000);
    fbp = `fb.1.${now}.${random}`;
    setMetaCookie("_fbp", fbp);
  }

  return { fbp, fbc };
}

function eventId(type: TrackType): string {
  return `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function track(type: TrackType, opts?: TrackOptions): void {
  if (typeof window === "undefined") return;

  const id = eventId(type);
  const path = opts?.path ?? window.location.pathname;
  const contentIds = [
    ...new Set(
      (opts?.contentIds?.length
        ? opts.contentIds
        : opts?.contentId
          ? [opts.contentId]
          : []
      )
        .map((contentId) => contentId.trim())
        .filter(Boolean),
    ),
  ];
  // Query strings on our pages can hold personal data, and this URL is handed
  // to Meta as event_source_url. Path only.
  const sourceUrl = `${window.location.origin}${path}`;
  const attribution = metaAttribution();

  // Meta Pixel (browser side). Fires first and unconditionally: it must not
  // depend on our own API or on the session cookie being writable.
  pixelTrack(
    META_EVENT[type],
    {
      ...(contentIds.length
        ? { content_ids: contentIds, content_type: "product" }
        : {}),
      ...(opts?.contentName ? { content_name: opts.contentName } : {}),
      ...(opts?.value != null ? { value: opts.value, currency: "INR" } : {}),
      ...(opts?.paymentMethod
        ? { payment_method: opts.paymentMethod }
        : {}),
    },
    id,
  );

  // First-party: our admin Traffic dashboard, which also relays to the
  // Conversions API using the same event id as the pixel call above.
  let sid = "";
  try {
    sid = sessionId();
  } catch {
    // Cookies blocked — the pixel call above still went out.
  }
  if (sid) {
    try {
      void fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sessionId: sid,
          path,
          productId: opts?.productId,
          contentIds: contentIds.length ? contentIds : undefined,
          contentName: opts?.contentName,
          value: opts?.value,
          paymentMethod: opts?.paymentMethod,
          eventId: id,
          sourceUrl,
          fbp: attribution.fbp,
          fbc: attribution.fbc,
        }),
        keepalive: true, // survive navigation
      }).catch(() => undefined);
    } catch {
      // ignore — analytics must never break the page
    }
  }

  // Mirror to GA4 (gtag) when present.
  const gtag = window.gtag;
  if (typeof gtag === "function") {
    try {
      if (type === "PAGE_VIEW") gtag("event", "page_view", { page_path: path });
      else if (type === "PRODUCT_VIEW")
        gtag("event", "view_item", { item_id: opts?.productId });
      else if (type === "ADD_TO_CART")
        gtag("event", "add_to_cart", { item_id: opts?.productId });
      else if (type === "INITIATE_CHECKOUT")
        gtag("event", "begin_checkout", {
          value: opts?.value,
          currency: "INR",
        });
      else if (type === "ADD_PAYMENT_INFO")
        gtag("event", "add_payment_info", {
          value: opts?.value,
          currency: "INR",
          payment_type: opts?.paymentMethod,
        });
      else if (type === "LEAD")
        gtag("event", "generate_lead", { value: opts?.value });
    } catch {
      // Analytics integrations are non-critical storefront dependencies.
    }
  }
}
