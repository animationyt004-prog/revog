# Shopify migration — URL map

Captured from the live `sitemap.xml` on 2026-08-17: **35 indexed URLs**
(17 products, 7 collections, 5 policies, 4 pages, 1 category, 1 homepage).

The whole point of this document is that most of those URLs should not change.

## The rule that saves the SEO

Shopify already uses the URL shape this site uses:

| | This site | Shopify |
|---|---|---|
| Product | `/products/<slug>` | `/products/<handle>` |
| Collection | `/collections/<slug>` | `/collections/<handle>` |

So if every Shopify product and collection **handle is set to the slug the
site uses today**, 24 of the 35 URLs carry over byte-for-byte and need no
redirect at all. Those 24 are the ones earning the organic traffic — the
product titles are deliberately descriptive for exactly that reason.

Shopify derives a handle from the product title on import, and the live titles
do **not** produce these slugs (`Women Zari Embroidered Georgette Saree with
Scalloped Border & Matching Blouse` → `women-zari-embroidered-georgette-saree-with-scalloped-border-matching-blouse`,
not `women-zari-embroidered-georgette-saree-scalloped-border`). The handle
column must therefore be set explicitly in the import CSV, not left to Shopify.

**Verify after import, before launch:** every URL in `handles-must-match.txt`
must return 200 on the Shopify store. Any that 404s has a handle mismatch —
fix the handle rather than adding a redirect, because a redirect leaks a
little ranking on every hop.

## Redirects that are genuinely needed

`redirects.csv` is ready for Shopify's bulk importer
(Online Store → Navigation → URL Redirects → Import). Fifteen rows, and each
one exists because Shopify's structure differs, not because a slug changed.

| From | To | Why |
|---|---|---|
| `/category/sarees` | `/collections/sarees` | Shopify has no `/category` route. Needs a collection with handle `sarees`. |
| `/about` `/contact` `/faq` `/size-guide` | `/pages/…` | Shopify puts custom pages under `/pages/`. |
| `/policies/returns` | `/policies/refund-policy` | Shopify's built-in policy slugs are fixed and cannot be renamed. |
| `/policies/privacy` | `/policies/privacy-policy` | as above |
| `/policies/terms` | `/policies/terms-of-service` | as above |
| `/policies/shipping` | `/policies/shipping-policy` | as above |
| `/policies/cancellation` | `/pages/cancellation-policy` | Shopify has no built-in cancellation policy, so it becomes a normal page. |
| `/login` | `/account/login` | Shopify's account path. |
| `/account/orders` | `/account` | Shopify lists orders on the account root; individual orders live at tokenised URLs. |
| `/account/returns` | `/pages/cancellation-policy` | No native returns centre without an app. Revisit if a returns app is installed. |
| `/checkout` | `/cart` | Shopify checkout URLs are tokenised and cannot be linked to directly. |
| `/wishlist` | `/pages/wishlist` | No native wishlist. Needs an app, or the page explains it is gone. |

## Deliberately not redirected

- **`/order/<orderNumber>`** — order-status pages. Shopify's equivalents are
  tokenised per order, so no rule can map them. Customers reach their order
  from the email or from `/account`. Existing links will 404 after cutover;
  that is unavoidable, and these URLs are not indexed.
- **`/feed/google.xml`, `/feed/meta.xml`** — keep the current site serving
  these until Google Merchant Center and Meta Commerce Manager are switched to
  Shopify's sales channels. Pulling them early empties the catalogue and can
  disapprove running ads. Retire them only once both channels report a healthy
  sync from Shopify.
- **`/admin/*`** — internal. Should not be redirected or indexed.

## Before you flip DNS

1. Every URL in `handles-must-match.txt` returns 200 on the Shopify store.
2. `redirects.csv` imported, and each `Redirect to` target actually exists —
   a redirect to a missing page is worse than no redirect.
3. `sitemap.xml` on the Shopify store lists the products and collections.
4. Search Console: keep the property, submit the new sitemap on cutover day,
   and watch Coverage for a week.
5. Meta and Google catalogues sync from Shopify **before** the old feeds stop.
