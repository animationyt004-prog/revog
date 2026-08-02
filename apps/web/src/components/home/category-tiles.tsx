import Image from "next/image";
import Link from "next/link";
import { FadeUp } from "@/components/motion";
import type { CategoryData, ProductCardData } from "@/lib/types";

/** A category needs a real range behind it to be worth a slot here. One or two
 *  styles reads as an empty shelf, and the shopper who taps it bounces. */
const MIN_PRODUCTS = 4;

/**
 * Circular category rail. Categories carry no artwork of their own in the
 * database, so the circle falls back to a photograph from a product inside
 * that category — which also means the imagery updates itself as the range
 * changes, instead of going stale against a hand-set banner.
 */
export function CategoryTiles({
  categories,
  products = [],
}: {
  categories: CategoryData[];
  products?: ProductCardData[];
}) {
  const shown = categories.filter((c) => c._count.products >= MIN_PRODUCTS);
  if (shown.length === 0) return null;

  const shotFor = (slug: string) =>
    products.find((p) => p.category?.slug === slug && p.image)?.image?.url ?? null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <FadeUp>
        <div className="mb-8 flex items-center justify-center gap-4 sm:mb-10">
          <span aria-hidden className="h-px w-10 bg-paper/25 sm:w-16" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-paper">
            Shop by category
          </h2>
          <span aria-hidden className="h-px w-10 bg-paper/25 sm:w-16" />
        </div>
      </FadeUp>

      <ul className="flex flex-wrap items-start justify-center gap-x-6 gap-y-7 sm:gap-x-10">
        {shown.map((cat, i) => {
          const shot = cat.image ?? shotFor(cat.slug);
          return (
            <FadeUp key={cat.id} delay={i * 0.06}>
              <li className="w-20 sm:w-28">
                <Link href={`/category/${cat.slug}`} className="group block text-center">
                  <span className="relative block aspect-square overflow-hidden rounded-full bg-ink-2 ring-1 ring-paper/10 transition-all duration-500 group-hover:ring-volt/60">
                    {shot && (
                      <Image
                        src={shot}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(max-width: 640px) 80px, 112px"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    )}
                  </span>
                  <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors group-hover:text-volt sm:text-[11px]">
                    {cat.name}
                  </span>
                </Link>
              </li>
            </FadeUp>
          );
        })}

        <FadeUp delay={shown.length * 0.06}>
          <li className="w-20 sm:w-28">
            <Link href="/collections/new-arrivals" className="group block text-center">
              {/* The disc repeats the caption for looks; hidden from the
                  accessibility tree so it isn't announced twice. */}
              <span
                aria-hidden
                className="grid aspect-square place-items-center rounded-full bg-paper text-center transition-colors duration-500 group-hover:bg-volt"
              >
                <span className="display text-[11px] uppercase tracking-[0.14em] text-ink sm:text-xs">
                  New in
                </span>
              </span>
              <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors group-hover:text-volt sm:text-[11px]">
                New in
              </span>
            </Link>
          </li>
        </FadeUp>
      </ul>
    </section>
  );
}
