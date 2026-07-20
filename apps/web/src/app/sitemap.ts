import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api";
import { SITE_URL as SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getProducts({ take: 48 }),
    getCategories(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    ...["new-arrivals", "trending", "limited", "bestsellers"].map((c) => ({
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
    ...categories.map((c) => ({
      url: `${SITE}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
