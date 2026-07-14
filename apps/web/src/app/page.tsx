import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/product-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories, getProducts } from "@/lib/api";

export default async function HomePage() {
  const [newDrops, bestSellers, trending, categories] = await Promise.all([
    getProducts({ collection: "new", take: 8 }),
    getProducts({ collection: "bestsellers", take: 8 }),
    getProducts({ collection: "trending", take: 4 }),
    getCategories(),
  ]);

  return (
    <>
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
