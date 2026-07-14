import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
