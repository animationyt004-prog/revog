import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FadeUp } from "@/components/motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { ProductCard } from "@/components/product/product-card";
import { getProducts, type Collection } from "@/lib/api";

const COLLECTIONS: Record<
  string,
  { api: Collection; title: string; accent: string; blurb: string }
> = {
  "new-arrivals": {
    api: "new",
    title: "New",
    accent: "Drops",
    blurb: "Fresh off the press. The latest NO CURFEW releases.",
  },
  trending: {
    api: "trending",
    title: "Trending",
    accent: "Now",
    blurb: "What the streets are wearing right now.",
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
  },
};

interface Props {
  params: Promise<{ collection: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const meta = COLLECTIONS[collection];
  return {
    title: meta ? `${meta.title} ${meta.accent}` : "Collection",
    description: meta?.blurb,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { collection } = await params;
  const meta = COLLECTIONS[collection];
  if (!meta) notFound();

  const products = await getProducts({ collection: meta.api, take: 48 });

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <FadeUp>
          <h1 className="display text-5xl sm:text-6xl">
            {meta.title} <span className="text-volt">{meta.accent}</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-paper-dim">{meta.blurb}</p>
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
