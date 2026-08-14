import type { Request } from 'express';

/**
 * The shopper's own IP, not the proxy's.
 *
 * Meta uses it to match a server-side event to the browser that produced it,
 * and every request reaches us through a CDN or load balancer — so `req.ip` is
 * an edge node unless X-Forwarded-For is read first. The left-most entry is
 * the original client; the rest are the hops in between.
 */
export function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();
  return first || req.ip;
}
