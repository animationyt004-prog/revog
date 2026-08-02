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
      {/* Ghost background type, drifting slowly. Desktop-only: on mobile this
          decorative strip becomes the LCP element and tanks the score. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden flex-col justify-center opacity-60 sm:flex">
        <div className="flex w-max animate-marquee-slow whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="display text-outline mx-4 text-[16vw] leading-none">
              HYRA FASHION
            </span>
          ))}
        </div>
      </div>

      {/* Volt corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-volt/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="hero-fade mb-5 inline-block border border-volt/50 px-3 py-1 text-xs font-semibold tracking-[0.25em] text-volt">
            NEW ARRIVALS
          </p>

          <h1 className="display text-[10.5vw] leading-[1.05] sm:text-[10vw] sm:leading-[1.02] lg:text-[7rem]">
            <span className="block overflow-hidden pb-1">
              <span className="hero-line">Indian fashion,</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="hero-line hero-line-2 italic text-volt">all in one place.</span>
            </span>
          </h1>

          <p className="hero-fade hero-fade-1 mt-6 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base">
            Kurtis, kurtas, sarees, tees and shirts - picked for fit, fabric and
            how they actually feel to wear all day.
          </p>

          <div className="hero-fade hero-fade-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/collections/new-arrivals"
              className="display group inline-flex items-center gap-2 rounded-sm bg-volt px-8 py-3.5 text-lg text-ink transition-transform hover:-translate-y-0.5"
            >
              Shop New Arrivals
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

        {featured.length > 0 && (
          <div className="hero-fade hero-fade-2 grid grid-cols-3 gap-2 sm:gap-3">
            {featured.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className={`group relative block overflow-hidden bg-ink-2 ${
                  index === 1 ? "mt-8" : index === 2 ? "mt-16" : ""
                }`}
              >
                {product.image && (
                  <Image
                    src={product.image.url}
                    alt={product.image.alt}
                    width={360}
                    height={480}
                    priority={index === 0}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-3 pt-10">
                  <p className="truncate text-xs font-semibold text-paper">
                    {product.name}
                  </p>
                  <p className="text-xs text-volt">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
