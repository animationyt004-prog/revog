/** Query strings on our own pages have carried personal data (the order page
 *  used to take `?email=`). Nothing we forward to Meta needs them, so the last
 *  hop out drops them regardless of what the browser sent. */
export function stripQuery(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

/**
 * The buyer-side context Meta needs to match a server-side event to a browser.
 *
 * Captured on the checkout request and frozen onto the order, because the
 * Purchase that reports the sale is sent later — from Razorpay's webhook or a
 * COD confirmation — when the buyer's browser is long gone. Without it, Meta
 * sees an anonymous conversion it cannot attribute to an ad click.
 */
export interface MetaAttribution {
  /** Meta's browser id cookie. */
  fbp?: string;
  /** Meta's click id cookie, derived from `fbclid` on the landing URL. */
  fbc?: string;
  /** The page the order was placed from, query string removed. */
  sourceUrl?: string;
  ip?: string;
  userAgent?: string;
}

/** Field caps. The DTO already bounds what the browser may send; these bound
 *  the header-derived values too, so one request cannot bloat the column. */
const LIMITS: Record<keyof MetaAttribution, number> = {
  fbp: 128,
  fbc: 600,
  sourceUrl: 300,
  ip: 64,
  userAgent: 400,
};

/** Normalise into something worth storing, or `undefined` when the request
 *  carried nothing — an order with no attribution should hold null, not an
 *  empty object that later reads as "we captured this". */
export function toMetaAttribution(
  input: MetaAttribution,
): MetaAttribution | undefined {
  const cleaned: MetaAttribution = {};
  for (const key of Object.keys(LIMITS) as (keyof MetaAttribution)[]) {
    const raw = key === 'sourceUrl' ? stripQuery(input.sourceUrl) : input[key];
    const value = raw?.trim().slice(0, LIMITS[key]);
    if (value) cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/** Read the column back. It is `Json?`, so anything could be in there —
 *  including rows written before the column existed. */
export function readMetaAttribution(value: unknown): MetaAttribution {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const pick = (key: keyof MetaAttribution): string | undefined => {
    const field = record[key];
    return typeof field === 'string' && field ? field : undefined;
  };
  return {
    fbp: pick('fbp'),
    fbc: pick('fbc'),
    sourceUrl: pick('sourceUrl'),
    ip: pick('ip'),
    userAgent: pick('userAgent'),
  };
}
