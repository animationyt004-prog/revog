import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/product-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories, getProducts } from "@/lib/api";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "REVOG",
  url: SITE,
  description:
    "REVOG — Indian streetwear. Oversized tees, heavyweight hoodies, cargos and joggers.",
};

export default async function HomePage() {
  const [newDrops, bestSellers, trending, categories] = await Promise.all([
    getProducts({ collection: "new", take: 8 }),
    getProducts({ collection: "bestsellers", take: 8 }),
    getProducts({ collection: "trending", take: 4 }),
    getCategories(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <PromoTicker />
      <Navbar />
      <main>
        <Hero />
        <ProductSection
          title="New"
          accent="Drops"
          href="/collections/new-arrivals"
          products={newDrops}
          layout="rail"
        />
        <CategoryTiles categories={categories} />
        <ProductSection
          title="Best"
          accent="Sellers"
          href="/collections/bestsellers"
          products={bestSellers}
        />
        <ProductSection
          title="Trending"
          accent="Now"
          href="/collections/trending"
          products={trending}
        />
      </main>
      <Footer />
    </>
  );
}
