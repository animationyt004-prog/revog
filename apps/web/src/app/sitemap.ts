import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api";
import { stockedCollectionSlugs } from "@/lib/collections";
import { SITE_URL as SITE } from "@/lib/site";

/**
 * Only URLs worth crawling. Collections and categories are checked for stock
 * first — an empty landing page is thin content, and a sitemap full of them
 * spends crawl budget on pages that cannot rank while signalling a thinner
 * site than we have. Both still carry noindex of their own; this keeps us
 * from actively pointing Google at them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([
    getProducts({ take: 200 }),
    getCategories(),
    stockedCollectionSlugs(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...collections.map((c) => ({
      url: `${SITE}/collections/${c}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    // Trust / info pages — required reading for shoppers and payment gateways.
    ...[
      "about",
      "contact",
      "size-guide",
      "policies/shipping",
      "policies/returns",
      "policies/privacy",
      "policies/terms",
    ].map((p) => ({
      url: `${SITE}/${p}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  return [
    ...staticPages,
    ...categories
      .filter((c) => c._count.products > 0)
      .map((c) => ({
        url: `${SITE}/category/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...products.map((p) => ({
      url: `${SITE}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      // Image sitemap entries — gets product shots into Google Images, which
      // is a major discovery surface for fashion queries.
      ...(p.image ? { images: [p.image.url] } : {}),
    })),
  ];
}
