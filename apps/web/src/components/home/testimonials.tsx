import Link from "next/link";
import { Star } from "lucide-react";
import { FadeUp } from "@/components/motion";
import type { Testimonial } from "@/lib/api";

/**
 * Quotes from buyers who actually received the order. When there are none
 * yet the section says so and points at the catalogue, rather than filling
 * the space with invented praise — Product pages here carry aggregateRating,
 * and fabricated reviews put the search rich snippets at risk.
 */
export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  const quotes = reviews.filter((r) => r.body);

  return (
    <section aria-label="Customer reviews" className="border-y border-paper/10 bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14">
        <FadeUp>
          <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
            <Star size={30} className="shrink-0 text-volt" strokeWidth={1.4} />
            <p className="display text-2xl leading-tight sm:text-3xl">
              Loved by
              <span className="block text-volt">thousands</span>
            </p>
          </div>
        </FadeUp>

        {quotes.length === 0 ? (
          <FadeUp delay={0.06}>
            <div className="max-w-lg">
              <p className="text-sm leading-relaxed text-paper-dim">
                No reviews yet — this space is for our customers, so it stays
                empty until they fill it. Order something and tell us how the
                fabric held up.
              </p>
              <Link
                href="/collections/new-arrivals"
                className="mt-4 inline-block text-sm font-semibold text-volt underline underline-offset-4"
              >
                Browse new arrivals
              </Link>
            </div>
          </FadeUp>
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {quotes.map((r, i) => (
              <FadeUp
                key={r.id}
                delay={i * 0.05}
                className="w-[78vw] shrink-0 snap-start sm:w-72"
              >
                <figure className="flex h-full flex-col border-l border-paper/15 pl-5">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: r.rating }).map((_, s) => (
                      <Star key={s} size={13} className="fill-volt text-volt" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm leading-relaxed text-paper">
                    {r.body}
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-paper-dim">
                    — {r.author} ·{" "}
                    <Link
                      href={`/products/${r.product.slug}`}
                      className="underline underline-offset-2 hover:text-volt"
                    >
                      {r.product.name}
                    </Link>
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
