import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { BUSINESS } from "@/lib/business";

/**
 * Editorial band between the product rails and the reviews: who is selling
 * this, and why the price is what it is.
 *
 * Deliberately text-only. The page above it is already six rows of
 * photography, and another hero shot here would read as filler — the point of
 * this block is that it is the one place on the homepage that talks. It also
 * keeps the homepage's image weight where it earns something, which matters
 * while the site serves unoptimised originals.
 *
 * Every claim is lifted from the About page rather than written fresh, so the
 * two cannot drift apart and nothing here is a promise the business has not
 * already made in public.
 */

const POINTS = [
  {
    heading: "Bought at the source",
    body: `We buy from established wholesale markets in ${BUSINESS.address.city} and sell straight to you. No middle layer, so the price stays reasonable without the fabric getting thinner.`,
  },
  {
    heading: "Described as it is",
    body: "Every listing says what actually arrives — fabric, length, and what is in the box. Sarees ship with an unstitched blouse piece unless the page says otherwise.",
  },
  {
    heading: "Chosen, not listed",
    body: "Everyday ethnic and casual wear picked for fit, fabric and how it holds up after a wash — not whatever the catalogue happened to carry that week.",
  },
];

export function BrandStory() {
  return (
    <section className="bg-ink" aria-label={`About ${BUSINESS.name}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeUp>
          <div className="grid gap-8 border-t border-paper/15 pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-xs tracking-[0.2em] text-paper-dim">
                WHY {BUSINESS.name.toUpperCase()}
              </p>
              <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">
                Buying clothes online
                <span className="block text-gold">should be straightforward.</span>
              </h2>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 text-sm text-paper transition-colors hover:text-volt"
              >
                Read our story
                <ArrowRight size={15} />
              </Link>
            </div>

            <ul className="grid gap-7 sm:grid-cols-3 lg:gap-8">
              {POINTS.map(({ heading, body }) => (
                <li key={heading}>
                  <h3 className="text-sm font-semibold leading-snug text-paper">
                    {heading}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
