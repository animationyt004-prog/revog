"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/format";
import type { BadgeType, ProductCardData } from "@/lib/types";

const BADGE_STYLES: Record<BadgeType, string> = {
  SALE: "bg-blood text-paper",
  NEW: "bg-volt text-ink",
  LIMITED: "bg-paper text-ink",
  TRENDING: "bg-ink-3 text-volt border border-volt/40",
  BESTSELLER: "bg-ink-3 text-paper border border-paper/30",
};

/** Grid card: hover image swap, badges, color dots, rating, stock states.
 *  Quick-add and wishlist are visual stubs until cart lands (Phase 3). */
export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stockLabel === "SOLD_OUT";
  const shownBadges = product.badges
    .filter((b) => (b === "SALE" ? product.discountPercent > 0 : true))
    .slice(0, 2);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block select-none"
      aria-label={product.name}
    >
      {/* Image block */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-2">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-500",
              product.hoverImage && "group-hover:opacity-0",
              soldOut && "opacity-40 grayscale",
            )}
          />
        )}
        {product.hoverImage && (
          <Image
            src={product.hoverImage.url}
            alt={product.hoverImage.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "scale-105 object-cover opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100",
              soldOut && "grayscale",
            )}
          />
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.discountPercent > 0 && !soldOut && (
            <span className={cn("display px-2 py-0.5 text-xs", BADGE_STYLES.SALE)}>
              -{product.discountPercent}%
            </span>
          )}
          {shownBadges
            .filter((b) => b !== "SALE")
            .map((b) => (
              <span key={b} className={cn("display px-2 py-0.5 text-xs", BADGE_STYLES[b])}>
                {b}
              </span>
            ))}
        </div>

        {/* Wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/60 backdrop-blur-sm transition-colors hover:bg-blood"
        >
          <Heart size={15} />
        </button>

        {/* Sold-out overlay */}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="display border border-paper/40 px-4 py-1.5 text-lg tracking-wider">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Quick add — slides up on hover (desktop) */}
        {!soldOut && (
          <button
            onClick={(e) => e.preventDefault()}
            className="display absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center gap-1.5 bg-volt py-2.5 text-sm text-ink transition-transform duration-300 group-hover:translate-y-0 md:flex"
          >
            <Plus size={16} /> Quick Add
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2.5 space-y-1 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium text-paper">{product.name}</h3>
          {product.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-paper-dim">
              <Star size={11} className="fill-volt text-volt" />
              {product.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-paper">{formatPrice(product.price)}</span>
          {product.discountPercent > 0 && (
            <span className="text-paper-dim line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 rounded-full border border-paper/25"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-paper-dim">+{product.colors.length - 4}</span>
            )}
          </div>
          {product.stockLabel === "LOW_STOCK" && (
            <span className="text-[11px] font-semibold text-blood">Few left</span>
          )}
        </div>
      </div>
    </Link>
  );
}
