import type { Collection, ProductFilters } from "./api";

export interface CollectionDef {
  api?: Collection;
  filters?: Partial<ProductFilters>;
  title: string;
  accent: string;
  blurb: string;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * A collection is either one of the API's curated feeds (`api`) or a slice of
 * the catalogue defined by filters (`filters`) — fabric, occasion, price.
 * Only collections that actually have stock are listed; an empty landing page
 * reads as broken and earns nothing in search.
 */
export const COLLECTIONS: Record<string, CollectionDef> = {
  "new-arrivals": {
    api: "new",
    title: "New",
    accent: "Drops",
    blurb: "Fresh off the press. The latest HyraLuxe releases.",
    seoTitle: "New Arrivals Online - Latest Sarees, Kurtis & Fashion",
    seoDescription:
      "Shop new arrivals at HyraLuxe: latest sarees, kurtis, t-shirts & shirts online in India with COD, UPI, free shipping over Rs.999 & 7-day returns.",
  },
  trending: {
    api: "trending",
    title: "Trending",
    accent: "Now",
    blurb: "What the streets are wearing right now.",
    seoTitle: "Trending Sarees & Indian Fashion Online",
    seoDescription:
      "Explore trending sarees & Indian fashion at HyraLuxe. Shop georgette sarees, festive styles & daily wear online with COD & 7-day returns.",
  },
  limited: {
    api: "limited",
    title: "Limited",
    accent: "Edition",
    blurb: "Numbered runs. Once they're gone, they're gone.",
  },
  bestsellers: {
    api: "bestsellers",
    title: "Best",
    accent: "Sellers",
    blurb: "Proven favourites, restocked while we can.",
    seoTitle: "Best Selling Sarees & Indian Fashion Online",
    seoDescription:
      "Shop best selling sarees, kurtis & Indian fashion online at HyraLuxe. Popular styles with honest pricing, COD, UPI & 7-day returns.",
  },
  "georgette-sarees": {
    filters: { category: "sarees", fabrics: ["Georgette"] },
    title: "Georgette",
    accent: "Sarees",
    seoTitle: "Georgette Sarees Online - Party & Festive Styles",
    seoDescription:
      "Buy georgette sarees online at HyraLuxe. Shop lightweight embroidered, sequin & party wear sarees with COD & easy 7-day returns.",
    blurb:
      "Light, flowing georgette sarees that drape easily & carry all day — " +
      "embroidered, sequinned & zari-bordered.",
  },
  "cotton-sarees": {
    filters: { category: "sarees", fabrics: ["Cotton Silk", "Cotton Tissue"] },
    title: "Cotton",
    accent: "Sarees",
    seoTitle: "Cotton Sarees Online - Comfortable Everyday Styles",
    seoDescription:
      "Shop cotton & cotton-blend sarees online at HyraLuxe for office, daily & festive wear. COD, UPI & easy 7-day returns.",
    blurb:
      "Breathable cotton & cotton-blend sarees for long wear — soft, " +
      "comfortable & easy to manage.",
  },
  "festive-sarees": {
    filters: { category: "sarees", occasions: ["Festive"] },
    title: "Festive",
    accent: "Sarees",
    seoTitle: "Festive Sarees Online - Wedding & Puja Sarees",
    seoDescription:
      "Shop festive sarees online at HyraLuxe. Explore zari, embroidered & occasion-ready sarees for weddings, pujas & celebrations.",
    blurb: "Sarees picked for weddings, poojas & festive evenings.",
  },
  "sarees-under-999": {
    filters: { category: "sarees", maxPrice: 99900 },
    title: "Sarees Under",
    seoTitle: "Sarees Under Rs.999 Online - Affordable Sarees",
    seoDescription:
      "Shop sarees under Rs.999 online at HyraLuxe. Explore affordable daily, festive & party styles with COD & 7-day returns.",
    accent: "₹999",
    blurb: "Everything in the saree edit priced under ₹999.",
  },
  "party-wear-sarees": {
    filters: { category: "sarees", occasions: ["Party"] },
    title: "Party Wear",
    accent: "Sarees",
    blurb: "Statement sarees for birthdays, receptions, dinners & evening occasions.",
    seoTitle: "Party Wear Sarees Online - Georgette & Sequin Sarees",
    seoDescription:
      "Shop party wear sarees online at HyraLuxe. Georgette, sequin & evening sarees with blouse piece, COD, UPI & easy 7-day returns.",
  },
  "daily-wear-sarees": {
    filters: { category: "sarees", occasions: ["Daily"] },
    title: "Daily Wear",
    accent: "Sarees",
    blurb: "Lightweight sarees that are easy to drape, repeat & wear through the day.",
    seoTitle: "Daily Wear Sarees Online - Lightweight Sarees for Women",
    seoDescription:
      "Shop daily wear sarees online at HyraLuxe. Lightweight, easy-drape sarees for women with honest pricing, COD & 7-day returns.",
  },
  "office-wear-sarees": {
    filters: { category: "sarees", occasions: ["Office"] },
    title: "Office Wear",
    accent: "Sarees",
    blurb: "Refined sarees for office days, work events & understated celebrations.",
    seoTitle: "Office Wear Sarees Online - Elegant Sarees for Work",
    seoDescription:
      "Buy office wear sarees online at HyraLuxe. Elegant, lightweight sarees for work & formal days with COD, UPI & 7-day returns.",
  },
};

/** Products currently behind a collection. Drives both the sitemap and the
 *  robots tag: a landing page with nothing on it earns no ranking and drags
 *  the rest of the site down as thin content. */
export async function collectionCount(def: CollectionDef): Promise<number> {
  const { getProductList } = await import("./api");
  const scope = def.api ? { collection: def.api } : (def.filters ?? {});
  try {
    const { total } = await getProductList({ ...scope, take: 1 });
    return total;
  } catch {
    // An API that rejects the filter — an older deploy that doesn't know a
    // param yet — must not take the sitemap down with it. Unknown counts as
    // empty: the collection drops out of the sitemap and off the index until
    // the API can answer for it.
    return 0;
  }
}

/** Slugs that have stock right now, in declaration order. */
export async function stockedCollectionSlugs(): Promise<string[]> {
  const entries = Object.entries(COLLECTIONS);
  const counts = await Promise.all(entries.map(([, def]) => collectionCount(def)));
  return entries.filter((_, i) => counts[i] > 0).map(([slug]) => slug);
}
