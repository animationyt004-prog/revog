import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Full-viewport typographic hero. Server component — every element paints
 *  with the SSR HTML and animates via CSS only (globals.css hero-* rules).
 *  Nothing here may wait for hydration: this block owns the page's LCP. */
export function Hero() {
  return (
    <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden bg-ink">
      {/* Ghost background type, drifting slowly. Desktop-only: on mobile this
          decorative strip becomes the LCP element and tanks the score. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden flex-col justify-center opacity-60 sm:flex">
        <div className="flex w-max animate-marquee-slow whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="display text-outline mx-4 text-[16vw] leading-none">
              REVOG
            </span>
          ))}
        </div>
      </div>

      {/* Volt corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-volt/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <p className="hero-fade mb-5 inline-block border border-volt/50 px-3 py-1 text-xs font-semibold tracking-[0.25em] text-volt">
          NEW FESTIVE COLLECTION
        </p>

        <h1 className="display text-[15vw] leading-[1.02] sm:text-[10vw] lg:text-[8rem]">
          <span className="block overflow-hidden pb-1">
            <span className="hero-line">Drape the</span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span className="hero-line hero-line-2 italic text-volt">occasion.</span>
          </span>
        </h1>

        <p className="hero-fade hero-fade-1 mt-6 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base">
          Handpicked festive sarees — organza, silk and georgette — that drape
          effortlessly and arrive with a matching blouse piece.
        </p>

        <div className="hero-fade hero-fade-2 mt-8 flex flex-wrap gap-3">
          <Link
            href="/category/sarees"
            className="display group inline-flex items-center gap-2 rounded-sm bg-volt px-8 py-3.5 text-lg text-ink transition-transform hover:-translate-y-0.5"
          >
            Shop Sarees
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/collections/bestsellers"
            className="display inline-flex items-center rounded-sm border border-paper/25 px-8 py-3.5 text-lg text-paper transition-colors hover:border-volt hover:text-volt"
          >
            Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
}
