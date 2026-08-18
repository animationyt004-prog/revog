# Shopify migration — collections

Shopify has no CSV import for collections, so these are created by hand (or
via the Admin API) **before** the redirects are imported — a redirect pointing
at a collection that does not exist is worse than no redirect.

The handle column is not cosmetic: seven of these URLs are in the live
sitemap and carry organic traffic. Handle must match exactly.

## Live collections — handles that must be preserved

| Handle | Title shown | How it should fill in Shopify |
|---|---|---|
| `new-arrivals` | New Drops | Automated: sort by newest. All 17 products qualify. |
| `trending` | Trending Now | Automated: tag is `Trending` (2 products) |
| `georgette-sarees` | Georgette Sarees | Automated: tag is `Georgette` (3 products) |
| `cotton-sarees` | Cotton Sarees | Automated: tag is `Cotton Silk` **or** `Cotton Tissue` (2 products) |
| `festive-sarees` | Festive Sarees | Automated: tag is `Festive` (15 products) |
| `party-wear-sarees` | Party Wear Sarees | Automated: tag is `Party` (17 products) |
| `sarees-under-999` | Sarees Under ₹999 | Automated: price is less than 999 (4 products) |

Every count above was read from the live collection's `CollectionPage` JSON-LD,
so each Shopify collection should land on the same number. If one comes out
short after import, the tag did not apply — check the product, not the rule.

## One collection that does not exist yet

`/category/sarees` is in the live sitemap and redirects to `/collections/sarees`,
so a collection with handle **`sarees`** must be created — automated on
product type `Sarees`, which every row of `products.csv` carries.

## Where the tags come from

`products.csv` writes `Type` (Sarees) and `Tags`. The fabric tag comes from
the Meta feed's `g:material`. The occasion tags — `Festive`, `Party`,
`Trending` — do **not** exist in the feed; they were read back from each live
collection's JSON-LD and merged into the export, so every collection above can
be automated rather than filled by hand.

One caveat worth knowing at import time: these tags are a snapshot of
membership on 2026-08-17. On the current site the occasion collections are
driven by a field on the product, so if a product's occasion changes later,
the Shopify tag will not follow it — it becomes a thing to maintain in Shopify
admin instead.

## Not currently live, so not required at cutover

`limited`, `bestsellers`, `daily-wear-sarees` and `office-wear-sarees` are
defined in `collections.ts` but absent from the live sitemap — they hold no
stock, and the code hides collections with nothing in them. Recreate them only
when there is stock to fill them.
