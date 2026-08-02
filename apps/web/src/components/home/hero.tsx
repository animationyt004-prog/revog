import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/lib/types";

/**
 * Full-bleed opening banner. The backdrop is a real product photograph
 * rather than a stock lifestyle shot — the model images the supplier ships
 * already read as editorial, and using one means the first thing a visitor
 * sees is something they can actually buy.
 *
 * Server component, so the headline and the banner image are in the SSR
 * HTML and carry the LCP without waiting on hydration.
 */
export function Hero({ products = [] }: { products?: ProductCardData[] }) {
  const backdrop = products.find((p) => p.image)?.image ?? null;

  return (
    <section className="relative isolate overflow-hidden bg-ink-2">
      {backdrop && (
        <>
          <Image
            src={backdrop.url}
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_28%]"
          />
          {/* Readability wash, weighted to the left where the copy sits so the
              garment on the right stays true to colour. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/25 sm:to-transparent"
          />
        </>
      )}

      <div className="relative mx-auto flex min-h-[74svh] max-w-7xl items-center px-4 py-16 sm:min-h-[82svh] sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="hero-fade text-[11px] font-semibold tracking-[0.3em] text-volt">
            NEW COLLECTION
          </p>

          <h1 className="display mt-5 text-[11vw] leading-[1.04] sm:text-[6vw] lg:text-[4.6rem]">
            <span className="block overflow-hidden pb-1">
              <span className="hero-line">Timeless elegance,</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="hero-line hero-line-2 italic text-volt">draped your way.</span>
            </span>
          </h1>

          <p className="hero-fade hero-fade-1 mt-5 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base">
            Printed silk, organza and georgette — light enough to carry through
            a long function, and every one arrives with its blouse piece.
          </p>

          <div className="hero-fade hero-fade-2 mt-8 flex flex-wrap gap-3 sm:mt-10">
            <Link
              href="/collections/new-arrivals"
              className="display group inline-flex items-center gap-2 rounded-sm bg-paper px-7 py-3.5 text-base text-ink transition-all duration-300 hover:-translate-y-0.5 sm:px-9 sm:text-lg"
            >
              Shop New Arrivals
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/collections/bestsellers"
              className="display inline-flex items-center rounded-sm border border-paper/30 px-7 py-3.5 text-base text-paper transition-colors duration-300 hover:border-volt hover:text-volt sm:px-9 sm:text-lg"
            >
              Best Sellers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
