import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Statement first fold. Server component, so the headline and calls to
 *  action paint with the SSR HTML. The products themselves are carried by
 *  the sections below rather than a collage up here. */
export function Hero() {
  // Shorter than a full screen on phones: at 88svh the hero alone filled the
  // viewport and nothing for sale was visible without scrolling.
  return (
    <section className="relative flex min-h-[62svh] flex-col justify-center overflow-hidden bg-ink py-8 sm:min-h-[88svh] sm:py-10">
      {/* The drifting outlined wordmark that used to sit here is gone: at 16vw
          it cut across the headline and the product shots, and half-letters
          behind merchandise is the loudest thing on an otherwise quiet page. */}

      {/* A single soft wash in the corner, well clear of the photography. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-volt/10 blur-3xl"
      />

      {/* Single column now that the collage is gone — the two-column split
          would leave the right half of the fold empty. */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="hero-fade mb-5 text-[11px] font-semibold tracking-[0.3em] text-volt sm:mb-6">
            NEW ARRIVALS
          </p>

          {/* Saree-led on purpose. The old line promised kurtis, kurtas, tees
              and shirts — every one of those categories is empty, so it read
              as a catalogue we don't have rather than the edit we do. */}
          <h1 className="display text-[10.5vw] leading-[1.05] sm:text-[9vw] sm:leading-[1.02] lg:text-[6.5rem]">
            <span className="block overflow-hidden pb-1">
              <span className="hero-line">Sarees you&apos;ll</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="hero-line hero-line-2 italic text-volt">actually reach for.</span>
            </span>
          </h1>

          <p className="hero-fade hero-fade-1 mt-6 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base">
            Printed silk, organza and georgette — light enough to carry through
            a long function, and every one arrives with its blouse piece.
          </p>

          <div className="hero-fade hero-fade-2 mt-8 flex flex-wrap gap-3 sm:mt-10">
            <Link
              href="/collections/new-arrivals"
              className="display group inline-flex items-center gap-2 rounded-sm bg-volt px-7 py-3.5 text-base text-ink transition-all duration-300 hover:-translate-y-0.5 sm:px-9 sm:text-lg"
            >
              Shop New Arrivals
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/collections/bestsellers"
              className="display inline-flex items-center rounded-sm border border-paper/25 px-7 py-3.5 text-base text-paper transition-colors duration-300 hover:border-volt hover:text-volt sm:px-9 sm:text-lg"
            >
              Best Sellers
            </Link>
          </div>

          {/* Quiet reassurance line — the things a first-time COD buyer checks
              before they trust an unfamiliar store. */}
          <p className="hero-fade hero-fade-2 mt-6 text-xs tracking-wide text-paper-dim sm:mt-8">
            Cash on Delivery · Free shipping over ₹999 · Easy 7-day returns
          </p>
        </div>

      </div>
    </section>
  );
}
