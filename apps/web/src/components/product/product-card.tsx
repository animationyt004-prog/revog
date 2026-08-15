"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Loader2, Plus, Star } from "lucide-react";
import { cn, formatPrice, sizeLabel } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { pixelTrack } from "@/lib/pixel";
import { track } from "@/lib/track";
import { useWishlist } from "@/lib/wishlist-store";
import type { BadgeType, ProductCardData } from "@/lib/types";

const SIZE_ORDER = ["FREE_SIZE", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

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

  const [quickOpen, setQuickOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);
  const wished = useWishlist(
    (s) => s.hydrated && s.slugs.includes(product.slug),
  );
  const toggleWish = useWishlist((s) => s.toggle);
  const hydrateWish = useWishlist((s) => s.hydrate);

  // Quick Add offers sizes for the first colour that has stock.
  const quickColor =
    product.colors.find((c) =>
      product.variants.some((v) => v.color === c.name && v.stock > 0),
    )?.name ?? product.colors[0]?.name;
  const quickSizes = product.variants
    .filter((v) => v.color === quickColor)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  function quickAdd(variantId: string) {
    setAddingId(variantId);
    // SKU, not the internal variant id — it is what the product feed publishes.
    const sku = product.variants.find((v) => v.id === variantId)?.sku;
    addItem(variantId)
      .then(() => {
        if (!sku?.trim()) return;
        track("ADD_TO_CART", {
          productId: product.id,
          contentId: sku,
          value: product.price / 100,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        setAddingId(null);
        setQuickOpen(false);
      });
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block select-none"
      aria-label={product.name}
    >
      {/*
       * Image block.
       *
       * `object-top` matters more than it looks. The card is a fixed 3/4 box and
       * supplier photos arrive at anything from 0.42 to 0.81, so `object-cover`
       * throws away up to 43% of the tallest ones. Cropping from the centre took
       * that out of both ends and decapitated the model; anchoring to the top
       * spends the whole loss on the hem instead, which the product page still
       * shows in full. It is a no-op on the photos that are already 3/4, and on
       * wider-than-3/4 photos the overflow is horizontal, so the crop stays
       * centred there. Strictly better in every case — but it is a rescue, not a
       * fix: the real repair is re-shooting or re-cropping the odd-sized assets.
       */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-2 ring-1 ring-paper/8 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_18px_44px_rgba(38,22,27,0.14)] group-hover:ring-volt/20">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover object-top transition-all duration-500",
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
              "scale-105 object-cover object-top opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100",
              soldOut && "grayscale",
            )}
          />
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.discountPercent > 0 && !soldOut && (
            <span
              className={cn(
                "display px-2.5 py-1 text-xs shadow-sm",
                BADGE_STYLES.SALE,
              )}
            >
              -{product.discountPercent}%
            </span>
          )}
          {shownBadges
            .filter((b) => b !== "SALE")
            .map((b) => (
              <span
                key={b}
                className={cn(
                  "display px-2.5 py-1 text-xs shadow-sm",
                  BADGE_STYLES[b],
                )}
              >
                {b}
              </span>
            ))}
        </div>

        {/* Wishlist */}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          onMouseEnter={hydrateWish}
          onClick={(e) => {
            e.preventDefault();
            if (!wished) {
              const sku = product.variants.find(
                (variant) => variant.stock > 0,
              )?.sku;
              pixelTrack("AddToWishlist", {
                content_name: product.name,
                content_type: "product",
                ...(sku?.trim() ? { content_ids: [sku.trim()] } : {}),
                value: product.price / 100,
                currency: "INR",
              });
            }
            toggleWish(product.slug);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-ink"
        >
          <Heart
            size={15}
            className={cn(
              "transition-colors",
              wished && "fill-blood text-blood",
            )}
          />
        </button>

        {/* Sold-out overlay */}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="display border border-paper/40 px-4 py-1.5 text-lg tracking-wider">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Quick add — slides up on hover (desktop); tap sizes to add */}
        {!soldOut && quickSizes.length > 0 && (
          <div
            onMouseLeave={() => setQuickOpen(false)}
            className="absolute inset-x-0 bottom-0 hidden translate-y-full transition-transform duration-300 group-hover:translate-y-0 md:block"
          >
            {quickOpen ? (
              <div className="flex items-stretch justify-center bg-volt">
                {quickSizes.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock === 0 || addingId !== null}
                    onClick={(e) => {
                      e.preventDefault();
                      quickAdd(v.id);
                    }}
                    className={cn(
                      "display flex-1 py-2.5 text-sm text-ink transition-colors hover:bg-paper hover:text-ink",
                      v.stock === 0 &&
                        "cursor-not-allowed text-ink/30 line-through hover:bg-transparent",
                    )}
                  >
                    {addingId === v.id ? (
                      <Loader2 size={14} className="mx-auto animate-spin" />
                    ) : (
                      sizeLabel(v.size)
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setQuickOpen(true);
                }}
                className="display flex w-full items-center justify-center gap-1.5 bg-volt py-2.5 text-sm text-ink"
              >
                <Plus size={16} /> Quick Add
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3.5 space-y-2 px-0.5">
        <div className="flex items-start justify-between gap-2">
          {/* min-w-0 is belt-and-braces: modern engines zero out min-width:auto
              once overflow is hidden, but the Android WebViews our buyers use
              don't, and there the long saree names stretch the whole grid. */}
          <h3 className="min-h-10 min-w-0 line-clamp-2 text-sm font-medium leading-5 text-paper transition-colors group-hover:text-volt">
            {product.name}
          </h3>
          {product.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-paper-dim">
              <Star size={11} className="fill-volt text-volt" />
              {product.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-paper">
            {formatPrice(product.price)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-paper-dim line-through">
              {formatPrice(product.mrp)}
            </span>
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
              <span className="text-[10px] text-paper-dim">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
          {product.stockLabel === "LOW_STOCK" && (
            <span className="text-[11px] font-semibold text-blood">
              Few left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
