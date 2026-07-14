import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FadeUp } from "@/components/motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getProducts } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: category ? category.name : "Category",
    description: category?.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ category: slug, take: 48 }),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <FadeUp>
          <h1 className="display text-5xl sm:text-6xl">
            {category.name}<span className="text-volt">.</span>
          </h1>
          {category.description && (
            <p className="mt-2 max-w-lg text-sm text-paper-dim">{category.description}</p>
          )}
          <p className="mt-1 text-xs text-paper-dim">{products.length} styles</p>
        </FadeUp>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((p, i) => (
            <FadeUp key={p.id} delay={i * 0.04}>
              <ProductCard product={p} />
            </FadeUp>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
