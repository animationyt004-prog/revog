import { Suspense } from "react";
import { FadeUp } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { getFacets, getProductList, type Collection } from "@/lib/api";
import { parseCatalogParams, type SearchParams } from "@/lib/catalog-params";
import { CatalogControls } from "./catalog-controls";

interface Props {
  title: string;
  accent: string;
  blurb?: string | null;
  scope: { category?: string; collection?: Collection };
  searchParams: SearchParams;
}

/** Server-rendered catalog page body: header, filter controls, grid. */
export async function CatalogView({ title, accent, blurb, scope, searchParams }: Props) {
  const filters = parseCatalogParams(searchParams);
  const [{ items, total }, facets] = await Promise.all([
    getProductList({ ...scope, ...filters, take: 48 }),
    getFacets(scope),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <FadeUp>
        <h1 className="display text-5xl sm:text-6xl">
          {title} <span className="text-volt">{accent}</span>
        </h1>
        {blurb && <p className="mt-2 max-w-lg text-sm text-paper-dim">{blurb}</p>}
      </FadeUp>

      {/* useSearchParams inside needs a Suspense boundary for prerendering */}
      <Suspense>
        <CatalogControls facets={facets} total={total} />
      </Suspense>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="display text-3xl text-paper-dim">Nothing matches.</p>
          <p className="mt-2 text-sm text-paper-dim">
            Loosen a filter or two — the drop you want is hiding.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {items.map((p, i) => (
            <FadeUp key={p.id} delay={Math.min(i * 0.04, 0.4)}>
              <ProductCard product={p} />
            </FadeUp>
          ))}
        </div>
      )}
    </main>
  );
}
