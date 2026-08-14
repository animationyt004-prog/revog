import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Unguessable per-order key that lets a shopper open their own order page.
 *
 * The order page used to be reached with `?email=` in the URL, which meant the
 * customer's address travelled into every referrer header, analytics hit and
 * ad-network beacon fired on that page. This is derived from the order number
 * with an HMAC, so it proves the same thing without being personal data, and
 * nothing extra has to be stored.
 */
export function orderViewToken(orderNumber: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(orderNumber)
    .digest('base64url')
    .slice(0, 22);
}

export function orderTokenMatches(
  orderNumber: string,
  secret: string,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const a = Buffer.from(orderViewToken(orderNumber, secret), 'utf8');
  const b = Buffer.from(token, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
