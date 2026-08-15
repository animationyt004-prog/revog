/**
 * Meta (Facebook / Instagram) commerce catalogue feed.
 *
 * Separate from the Google Merchant feed even though both are RSS 2.0 + the
 * `g:` namespace, because the two specs disagree in ways that decide whether
 * an item is eligible to run as an ad:
 *
 *   - Meta's availability vocabulary is "in stock" / "out of stock" (spaces),
 *     not Google's "in_stock".
 *   - Meta wants `quantity_to_sell_on_facebook` and `visibility`; without them
 *     items can land in the catalogue but sit outside every product set, which
 *     surfaces as "All the products in the selected product set are filtered
 *     out" at ad-set level.
 *   - Google drops out-of-stock variants; Meta prefers them kept and marked
 *     out of stock, so item ids stay stable and an item doesn't lose its
 *     accumulated engagement every time a size sells through.
 *
 * One entry per VARIANT, grouped via item_group_id — same shape Meta expects
 * for size/colour variations.
 *
 * The rendering here is deliberately data-source agnostic: it takes whatever
 * `ProductDetail` the storefront's `api.ts` produces, so it keeps working
 * across the Shopify migration.
 */

import { imagesForColor } from "./product-images";
import { SITE_NAME, SITE_URL } from "./site";
import type { ProductDetail, ProductVariantData } from "./types";

/** Meta's field limits. Over-long values get the item rejected outright. */
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 9999;
/** Meta accepts up to 20 additional images per item. */
const MAX_EXTRA_IMAGES = 20;

/** Google's taxonomy id for Clothing — Meta accepts Google's taxonomy. */
const GOOGLE_CATEGORY = "1604"; // Apparel & Accessories > Clothing

const GENDER: Record<string, string> = {
  WOMEN: "female",
  WOMEN_S: "female",
  FEMALE: "female",
  MEN: "male",
  MALE: "male",
  UNISEX: "unisex",
};

/**
 * Apparel items without a gender get flagged by Meta, and "unisex" on a saree
 * is worse than no answer — it widens delivery to men. This catalogue is
 * women's ethnic wear end to end, so an unset gender means the field simply
 * wasn't filled in, not that the product is genderless.
 */
const GENDER_FALLBACK = "female";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Paise → "1234.00 INR", the format Meta parses for INR. */
const money = (paise: number) => `${(paise / 100).toFixed(2)} INR`;

const clamp = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

/** FREE_SIZE isn't a recognised size value; "One Size" is the accepted wording. */
const sizeLabel = (size: string) =>
  size === "FREE_SIZE" ? "One Size" : size.replace(/_/g, " ");

/** Stable, non-empty item id. Falls back to the variant id when SKU is blank. */
const itemId = (v: ProductVariantData) => v.sku?.trim() || v.id;

function tag(name: string, value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return `      <${name}>${esc(value)}</${name}>\n`;
}

/**
 * The feed entries for one product — one per variant.
 *
 * Returns an empty array for products with no usable image: Meta requires
 * `image_link`, and an item without one is rejected on import rather than
 * merely warned about.
 */
export function metaFeedItems(p: ProductDetail): string[] {
  const fallback = p.images.find((i) => i.isPrimary) ?? p.images[0];
  if (!fallback) return [];

  const description = clamp(
    (p.description || p.name).replace(/\s+/g, " ").trim(),
    MAX_DESCRIPTION,
  );
  const gender = GENDER[p.gender?.toUpperCase().replace(/\s+/g, "_")] ?? GENDER_FALLBACK;

  return p.variants.map((v) => {
    const price = v.priceOverride ?? p.price;
    const onSale = p.mrp > price;
    const color = v.color?.trim() ?? "";

    const link = color
      ? `${SITE_URL}/products/${p.slug}?color=${encodeURIComponent(color)}`
      : `${SITE_URL}/products/${p.slug}`;
    const title = clamp(color ? `${color} ${p.name}` : p.name, MAX_TITLE);

    // Images are tagged with the colour they show. Taking the product's first
    // primary for every variant would ship one colour's photo against another
    // colour's g:color — a maroon saree pictured in teal. Untagged shots stay
    // usable as extras for any variant.
    const matched = imagesForColor(p.images, color);
    const gallery = matched
      ? [...matched, ...p.images.filter((i) => !i.color)]
      : p.images;
    const primary = gallery.find((i) => i.isPrimary) ?? gallery[0] ?? fallback;
    const extra = gallery
      .filter((i) => i !== primary)
      .slice(0, MAX_EXTRA_IMAGES);

    const inStock = v.stock > 0;

    return `    <item>
${tag("g:id", itemId(v))}${tag("g:item_group_id", p.slug)}${tag("title", title)}${tag("description", description)}${tag("link", link)}${tag("g:image_link", primary.url)}${extra
      .map((i) => `      <g:additional_image_link>${esc(i.url)}</g:additional_image_link>\n`)
      .join("")}${tag("g:availability", inStock ? "in stock" : "out of stock")}${tag(
      "g:quantity_to_sell_on_facebook",
      String(Math.max(0, v.stock)),
    )}${tag("g:visibility", "published")}${tag("g:condition", "new")}${tag(
      "g:price",
      money(onSale ? p.mrp : price),
    )}${onSale ? tag("g:sale_price", money(price)) : ""}${tag(
      "g:brand",
      p.brand || SITE_NAME,
    )}${tag("g:google_product_category", GOOGLE_CATEGORY)}${tag(
      "g:product_type",
      p.category?.name,
    )}${tag("g:color", color)}${tag("g:size", sizeLabel(v.size))}${tag(
      "g:age_group",
      "adult",
    )}${tag("g:gender", gender)}${tag("g:material", p.fabric)}    </item>`;
  });
}

/** The complete feed document for a set of products. */
export function metaFeedXml(products: ProductDetail[]): string {
  const items = products.flatMap(metaFeedItems).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>Festive sarees and ethnic wear from ${esc(SITE_NAME)}.</description>
${items}
  </channel>
</rss>`;
}

/** Served when the product source is unreachable, so Meta retries instead of
 *  emptying the catalogue — an empty 200 would delete every item. */
export function metaFeedUnavailableXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>Product feed temporarily unavailable. Please retry.</description>
  </channel>
</rss>`;
}
