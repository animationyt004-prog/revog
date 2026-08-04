"use client";

import { BadgePercent } from "lucide-react";
import { useCart } from "@/lib/cart-store";

/**
 * The multi-buy ladder, shown on the product page.
 *
 * Tiers come from the cart summary rather than a constant in this file, so the
 * card can never advertise a rate the server has stopped applying — the same
 * reason the prepaid line reads its percentage from there. An empty cart still
 * carries the ladder, which is what a first-time visitor has.
 *
 * "Auto applied" is a promise, so it is only made because CartService really
 * does apply it on quantity alone. Nothing here asks for a code.
 */
export function AvailableOffers() {
  const tiers = useCart((s) => s.cart?.summary.bundleTiers ?? []);
  const earned = useCart((s) => s.cart?.summary.bundlePercent ?? 0);

  if (tiers.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-paper">
        <BadgePercent size={18} className="text-volt" aria-hidden />
        Available Offers
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {tiers.map((tier) => {
          const active = earned >= tier.percent && earned > 0;
          return (
            <li
              key={tier.minQuantity}
              // The notch-and-perforation look of a paper coupon, drawn with a
              // border and one dashed rule rather than images.
              className={`relative overflow-hidden rounded-lg border px-4 py-3 text-center ${
                active ? "border-volt bg-volt/10" : "border-paper/15 bg-ink-2"
              }`}
            >
              <span
                aria-hidden
                className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink"
              />
              <span
                aria-hidden
                className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink"
              />
              <p className="text-xs text-paper-dim">
                {active ? "Applied — no coupon needed" : "Auto applied, no coupon needed"}
              </p>
              <p className="mt-2 border-t border-dashed border-paper/20 pt-2 text-sm text-paper">
                <span className="font-bold">Buy {tier.minQuantity}</span> sarees, get{" "}
                <span className="font-bold">{tier.percent}% off</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
