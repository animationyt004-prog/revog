import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getProductList } from "@/lib/api";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Search",
  description: "Search Hyra Fashion products by style, fabric, category or brand.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const { items, total } = query
    ? await getProductList({ q: query, take: 48 })
    : { items: [], total: 0 };

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-semibold tracking-[0.25em] text-volt">
          PRODUCT SEARCH
        </p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">
          {query ? (
            <>
              Results for <span className="text-volt">{query}</span>
            </>
          ) : (
            <>
              Search <span className="text-volt">Hyra</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-paper-dim">
          {query
            ? `${total} ${total === 1 ? "style" : "styles"} found`
            : "Use the search box above to find kurtis, sarees, shirts and more."}
        </p>

        {query && items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="display text-3xl text-paper-dim">No matching styles.</p>
            <p className="mt-2 text-sm text-paper-dim">
              Try a broader word like kurti, saree, cotton or shirt.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
