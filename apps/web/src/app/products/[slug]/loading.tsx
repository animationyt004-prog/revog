import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";

export default function Loading() {
  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto grid w-full max-w-7xl flex-1 animate-pulse gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-10">
        <div>
          <div className="h-4 w-56 bg-ink-2" />
          <div className="mt-3 aspect-[3/4] bg-ink-2" />
        </div>
        <div className="lg:pt-8">
          <div className="h-3 w-32 bg-ink-3" />
          <div className="mt-3 h-12 w-4/5 bg-ink-2" />
          <div className="mt-4 h-8 w-40 bg-ink-2" />
          <div className="mt-8 h-4 w-24 bg-ink-3" />
          <div className="mt-2 flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 w-12 bg-ink-2" />
            ))}
          </div>
          <div className="mt-8 h-14 w-full bg-ink-3" />
        </div>
      </main>
      <Footer />
    </>
  );
}
