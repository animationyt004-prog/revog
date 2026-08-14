import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { FadeUp } from "@/components/motion";
import type { Testimonial } from "@/lib/api";

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  const quotes = reviews.filter((review) => review.body);

  if (quotes.length === 0) {
    return (
      <section
        aria-label="The HyraLuxe standard"
        className="bg-night text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <FadeUp>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                The HyraLuxe standard
              </p>
              <h2 className="display mt-3 max-w-lg text-3xl leading-tight sm:text-5xl">
                Beautifully considered. Honestly presented.
              </h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.06}>
            <div className="border-l border-white/18 pl-6 sm:pl-8">
              <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">
                Clear fabric details, true product photography, secure payments
                and human support when you need it. Every HyraLuxe piece is
                presented with the information we would want before placing an
                order ourselves.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-block border-b border-gold pb-1 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:text-white"
              >
                Discover HyraLuxe
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Customer reviews" className="bg-night text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[230px_1fr] lg:items-center lg:gap-14">
        <FadeUp>
          <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
            <Star size={30} className="shrink-0 text-gold" strokeWidth={1.4} />
            <p className="display text-2xl leading-tight sm:text-3xl">
              Loved by our
              <span className="block text-gold">customers</span>
            </p>
            <p className="text-xs text-white/55">
              Only verified purchase reviews are shown.
            </p>
          </div>
        </FadeUp>

        <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {quotes.map((review, index) => (
            <FadeUp
              key={review.id}
              delay={index * 0.05}
              className="w-[78vw] shrink-0 snap-start sm:w-72"
            >
              <figure className="flex h-full flex-col border border-white/15 bg-white/[0.03]">
                {review.photoUrl && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={review.photoUrl}
                      alt={`Customer photo for ${review.product.name}`}
                      fill
                      sizes="288px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div
                    className="flex gap-0.5"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: review.rating }).map((_, star) => (
                      <Star
                        key={star}
                        size={13}
                        className="fill-gold text-gold"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm leading-relaxed text-white">
                    {review.body}
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1 text-gold">
                      <BadgeCheck size={12} /> Verified purchase
                    </span>
                    <span className="mt-1 block">{review.author} · </span>
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="underline underline-offset-2 hover:text-gold"
                    >
                      {review.product.name}
                    </Link>
                  </figcaption>
                </div>
              </figure>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
