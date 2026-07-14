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
}

export function ProductSection({
  title,
  accent,
  href,
  products,
  layout = "grid",
}: SectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <FadeUp>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="display text-4xl sm:text-5xl">
            {title} {accent && <span className="text-volt">{accent}</span>}
          </h2>
          <Link
            href={href}
            className="group mb-1 flex shrink-0 items-center gap-1 text-sm font-medium text-paper-dim transition-colors hover:text-volt"
          >
            View All
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeUp>

      {layout === "rail" ? (
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {products.map((p, i) => (
            <FadeUp key={p.id} delay={i * 0.05} className="w-[70vw] shrink-0 snap-start sm:w-[300px]">
              <ProductCard product={p} />
            </FadeUp>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((p, i) => (
            <FadeUp key={p.id} delay={i * 0.05}>
              <ProductCard product={p} />
            </FadeUp>
          ))}
        </div>
      )}
    </section>
  );
}
