# REVOG — streetwear e-commerce

Indian D2C streetwear store. Guest-first shopping, COD checkout, email-OTP
login, full admin control room. Built for ~1,000 visitors/day on free-tier
infra with clean headroom to ~20k/day.

## Stack

| Layer | Tech |
|---|---|
| Storefront | Next.js 16 (App Router, RSC, ISR), Tailwind v4, Framer Motion, Zustand |
| API | NestJS 11, Prisma 6, class-validator |
| Data | PostgreSQL (Neon), Redis (Upstash) — both ap-southeast-1 |
| Auth | Email OTP → JWT (15 m) + rotating refresh tokens (httpOnly cookie, family reuse-detection) |
| Payments | COD live · Razorpay backend ready (frontend parked) |

## Monorepo

```
apps/
  web/   Next.js storefront + /admin panel  (port 3000)
  api/   NestJS REST API under /api         (port 3001)
```

## Develop

```bash
npm install
npm run dev:api   # nest --watch on :3001
npm run dev:web   # next dev on :3000
```

Secrets live in `apps/api/.env` and `apps/web/.env.local` (both git-ignored);
`apps/web/.env.example` documents the web vars. In dev, login OTPs print to
the API console.

Useful:

```bash
npm run db:seed --workspace apps/api      # reset demo catalog (16 products)
npx prisma studio                          # visual DB browser (run in apps/api)
npx prisma migrate dev --name <change>     # new migration (run in apps/api)
```

## Money & domain rules

- All amounts are stored in **paise** (int). The client formats.
- Displayed prices are **GST-inclusive** (18% surfaced informationally).
- Shipping ₹99, free ≥ ₹999 after discounts. Percent coupons round to whole rupees.
- Stock changes are transactional: checkout decrements atomically, admin
  cancel and return-received restock.
- Login is always optional — guests browse, buy, and get claimed into an
  account automatically if they log in later with the same email.

## Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — click-by-click Railway (API,
`apps/api/Dockerfile`) + Vercel (web) + go-live checklist.
