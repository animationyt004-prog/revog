import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

/** Product-led first fold. Server component: the copy and first product image
 *  paint with SSR HTML so the storefront immediately shows what is for sale. */
export function Hero({ products = [] }: { products?: ProductCardData[] }) {
  const featured = products.filter((p) => p.image).slice(0, 3);

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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
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

        {/* Captions sit under the photograph, not on it. The gradient scrim
            that used to cover the bottom third muddied the exact part of a
            saree — pallu and border — that decides the sale. */}
        {featured.length > 0 && (
          <div className="hero-fade hero-fade-2 grid grid-cols-3 gap-4 sm:gap-6">
            {featured.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className={`group block min-w-0 ${
                  index === 1 ? "mt-6 sm:mt-10" : index === 2 ? "mt-12 sm:mt-20" : ""
                }`}
              >
                <div className="overflow-hidden bg-ink-2">
                  {product.image && (
                    <Image
                      src={product.image.url}
                      alt={product.image.alt}
                      width={360}
                      height={480}
                      priority={index === 0}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-[11px] leading-snug text-paper sm:text-xs">
                  {product.name}
                </p>
                <p className="mt-1 text-[11px] text-paper-dim sm:text-xs">
                  {formatPrice(product.price)}
                  {product.mrp > product.price && (
                    <span className="ml-1.5 line-through opacity-60">
                      {formatPrice(product.mrp)}
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
