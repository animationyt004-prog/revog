import { getProduct, getProducts } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { ProductDetail } from "@/lib/types";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 *
 * One entry per VARIANT, grouped by product via item_group_id — that's how
 * Merchant Center expects size/colour variations. Apparel in India also
 * requires colour, size, age_group and gender, so those are always emitted.
 *
 * Rebuilt hourly; Merchant Center is configured to fetch this URL on a
 * schedule.
 */
export const revalidate = 3600;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Paise → "1234.00 INR" as Merchant Center expects. */
const money = (paise: number) => `${(paise / 100).toFixed(2)} INR`;

/** Google's taxonomy id for Clothing (sarees live under it). */
const GOOGLE_CATEGORY = "1604"; // Apparel & Accessories > Clothing

const GENDER: Record<string, string> = {
  WOMEN: "female",
  MEN: "male",
  UNISEX: "unisex",
};

/** FREE_SIZE isn't a Google size value; "One Size" is the accepted wording. */
const sizeLabel = (size: string) =>
  size === "FREE_SIZE" ? "One Size" : size.replace(/_/g, " ");

function itemsFor(p: ProductDetail): string[] {
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
  if (!primary) return []; // no image => Merchant Center rejects the item

  const extra = p.images.filter((i) => i !== primary).slice(0, 10);
  const link = `${SITE_URL}/products/${p.slug}`;

  return p.variants.map((v) => {
    const price = v.priceOverride ?? p.price;
    const onSale = p.mrp > price;

    return `    <item>
      <g:id>${esc(v.sku || v.id)}</g:id>
      <g:item_group_id>${esc(p.slug)}</g:item_group_id>
      <title>${esc(p.name)}</title>
      <description>${esc(p.description)}</description>
      <link>${esc(link)}</link>
      <g:image_link>${esc(primary.url)}</g:image_link>
${extra.map((i) => `      <g:additional_image_link>${esc(i.url)}</g:additional_image_link>`).join("\n")}
      <g:availability>${v.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${money(onSale ? p.mrp : price)}</g:price>
${onSale ? `      <g:sale_price>${money(price)}</g:sale_price>` : ""}
      <g:brand>${esc(p.brand || SITE_NAME)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${GOOGLE_CATEGORY}</g:google_product_category>
${p.category ? `      <g:product_type>${esc(p.category.name)}</g:product_type>` : ""}
      <g:color>${esc(v.color)}</g:color>
      <g:size>${esc(sizeLabel(v.size))}</g:size>
      <g:age_group>adult</g:age_group>
      <g:gender>${GENDER[p.gender] ?? "unisex"}</g:gender>
${p.fabric ? `      <g:material>${esc(p.fabric)}</g:material>` : ""}
    </item>`
      // Drop the blank lines left by the conditional fields above.
      .replace(/^\s*\n/gm, "");
  });
}

export async function GET() {
  const list = await getProducts({ take: 48 });
  const details = await Promise.all(list.map((p) => getProduct(p.slug)));

  const items = details
    .filter((p): p is ProductDetail => p !== null)
    .flatMap(itemsFor)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>Festive sarees and ethnic wear from ${esc(SITE_NAME)}.</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
