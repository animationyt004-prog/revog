import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/types";

interface SectionProps {
  title: string;
  accent?: string;
  href: string;
  products: ProductCardData[];
  /** "rail" = horizontal scroll (mobile-friendly), "grid" = responsive grid */
  layout?: "rail" | "grid";
  /** Drop sold-out lines. On for shop-the-look rails like New Arrivals, where
   *  every tile is an invitation to buy and a dead one wastes the slot; off
   *  for listings where seeing the full range still has value. */
  inStockOnly?: boolean;
  tone?: "default" | "soft";
}

export function ProductSection({
  title,
  accent,
  href,
  products,
  layout = "grid",
  inStockOnly = false,
  tone = "default",
}: SectionProps) {
  const shown = inStockOnly
    ? products.filter((p) => p.stockLabel !== "SOLD_OUT")
    : products;
  if (shown.length === 0) return null;

  return (
    <section className={tone === "soft" ? "bg-ink-2" : "bg-ink"}>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <FadeUp>
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-paper/15 pb-5 sm:mb-9">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-volt">
                Curated edit
              </p>
              <h2 className="display text-3xl sm:text-5xl">
                {title} {accent && <span className="text-volt">{accent}</span>}
              </h2>
            </div>
            <Link
              href={href}
              className="group mb-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-paper-dim transition-colors hover:text-volt sm:text-sm sm:normal-case sm:tracking-normal"
            >
              View All
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </FadeUp>

        {layout === "rail" ? (
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 md:gap-x-5 md:gap-y-10 md:overflow-visible">
            {shown.map((p, i) => (
              <FadeUp
                key={p.id}
                delay={i * 0.05}
                className="w-[72vw] shrink-0 snap-start sm:w-[300px] md:w-auto"
              >
                <ProductCard product={p} />
              </FadeUp>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {shown.map((p, i) => (
              <FadeUp key={p.id} delay={i * 0.05}>
                <ProductCard product={p} />
              </FadeUp>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
