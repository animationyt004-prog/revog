# REVOG — Go-Live Guide

Everything runs online; no local installs needed. Do the steps in order.
Wherever a value is needed, it's listed in the env tables below.

## 0. Prerequisites you create (5-10 min each)

| Account | For | URL |
|---|---|---|
| GitHub | code hosting, deploy source | github.com |
| Railway | API hosting | railway.app (login with GitHub) |
| Vercel | storefront hosting | vercel.com (login with GitHub) |
| Cloudflare R2 | product images (later phase) | dash.cloudflare.com |

Neon (Postgres), Upstash (Redis) and Razorpay (test keys) already exist.

## 1. Push to GitHub

1. github.com → **New repository** → name `revog` → **Private** → Create.
2. Copy the repo URL, then (this one-time push can be run from any machine
   with the project, or ask Claude to run it):
   ```bash
   git remote add origin https://github.com/<you>/revog.git
   git push -u origin main
   ```

## 2. API on Railway

1. railway.app → **New Project** → **Deploy from GitHub repo** → pick `revog`.
2. Settings → **Build**: Builder = Dockerfile, Dockerfile path = `apps/api/Dockerfile`.
3. Settings → **Networking** → Generate Domain → note it, e.g.
   `revog-api.up.railway.app`.
4. **Variables** → add (copy real values from `apps/api/.env`):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | Neon URL |
   | `REDIS_URL` | Upstash `rediss://` URL |
   | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **fresh long random strings** — do NOT reuse dev values |
   | `JWT_ACCESS_TTL` | `15m` |
   | `JWT_REFRESH_TTL` | `30d` |
   | `CORS_ORIGINS` | `https://<your-domain>` (and the vercel.app URL while testing) |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | test keys now, live keys after KYC |

5. Deploy. Check `https://<railway-domain>/api/health/db` → `connected`.

> Migrations run automatically on every release (`prisma migrate deploy` in
> the Dockerfile CMD).

## 3. Storefront on Vercel

1. vercel.com → **Add New → Project** → import `revog`.
2. Root Directory = `apps/web` (Framework: Next.js auto-detected).
3. Environment Variables:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<railway-domain>/api` |
   | `API_URL` | `https://<railway-domain>/api` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | key id |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | your business number, e.g. `9198xxxxxx` |

4. Deploy → open the `.vercel.app` URL → full smoke test (browse, cart,
   coupon, guest COD order, admin login).

## 4. Custom domain

1. Buy the domain (Namecheap/GoDaddy/Cloudflare, ~₹800-1200/yr).
2. Vercel → Project → Settings → **Domains** → add `revog.in` + `www` →
   follow the DNS records it shows.
3. Update `NEXT_PUBLIC_SITE_URL` (Vercel) and `CORS_ORIGINS` (Railway).

## 5. Before real customers — hard checklist

- [ ] Fresh JWT secrets in Railway (never the dev ones)
- [ ] `CORS_ORIGINS` = only your real domain(s)
- [ ] Re-seed is OFF: never run `db:seed` against production data
- [ ] Replace placeholder product photos & copy (R2 phase)
- [ ] Resend account → real OTP emails (currently console-only)
- [ ] Razorpay KYC → live keys + wire frontend modal + webhook to
      `https://<railway-domain>/api` (webhook route added when enabled)
- [ ] Delete test orders/users from the DB
- [ ] PageSpeed Insights on the live URL (mobile ≥ 90 target)
- [ ] Legal pages: privacy, terms, shipping, returns (footer links exist)

## 6. Daily operations cheat-sheet (bookmark `/admin`)

| Task | Where |
|---|---|
| New orders aaye? | Admin → Dashboard (Orders Today) |
| Order pack/ship karna | Admin → Orders → expand → Mark PACKED / SHIPPED / DELIVERED |
| COD cash collect hua | Mark DELIVERED (payment auto-PAID) |
| Order cancel (restock) | Admin → Orders → Mark CANCELLED |
| Return aaya | Admin → Returns → APPROVED → RECEIVED (restocks) → REFUNDED |
| Stock update | Admin → Products → expand → edit numbers |
| Price change | Admin → Products → click the price |
| Sale chalana | Admin → Coupons → New Coupon |
| Product hide karna | Admin → Products → PUBLISHED toggle |
