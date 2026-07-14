import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";

export default function NotFound() {
  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="grid flex-1 place-items-center px-4 py-24 text-center">
        <div>
          <p className="display text-outline text-[8rem] leading-none sm:text-[12rem]">404</p>
          <h1 className="display mt-2 text-3xl sm:text-4xl">
            Off The <span className="text-volt">Map.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-paper-dim">
            This page broke curfew and never came back. Head home or hit the
            latest drop.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/"
              className="display bg-volt px-6 py-3 text-lg text-ink transition-transform hover:-translate-y-0.5"
            >
              Back Home
            </Link>
            <Link
              href="/collections/new-arrivals"
              className="display border border-paper/30 px-6 py-3 text-lg transition-colors hover:border-volt hover:text-volt"
            >
              New Drops
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
