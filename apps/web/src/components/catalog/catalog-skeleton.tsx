import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";

/** Shimmer placeholder shared by catalog-ish routes while data streams in. */
export function CatalogSkeleton() {
  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 animate-pulse px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-12 w-72 max-w-full bg-ink-3" />
        <div className="mt-3 h-4 w-96 max-w-full bg-ink-2" />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-ink-2" />
              <div className="mt-2.5 h-4 w-3/4 bg-ink-2" />
              <div className="mt-1.5 h-4 w-1/3 bg-ink-3" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
