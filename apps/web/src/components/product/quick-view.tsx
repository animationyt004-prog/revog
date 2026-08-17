"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeIndianRupee,
  Loader2,
  RotateCcw,
  Star,
  Truck,
  X,
} from "lucide-react";
import { amp } from "@/components/typography";
import { BUSINESS } from "@/lib/business";
import { useCart } from "@/lib/cart-store";
import { cn, formatPrice, sizeLabel } from "@/lib/format";
import { track } from "@/lib/track";
import type { ProductCardData } from "@/lib/types";

const SIZE_ORDER = ["FREE_SIZE", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/**
 * Quick View: answers "is this the one" without losing the shopper's place in
 * the grid, which is the whole point - a saree listing is browsed in sweeps,
 * and every trip to a product page costs the scroll position.
 *
 * It shows only what the card already holds. Fabric and blouse details live on
 * ProductDetail, not ProductCardData, so surfacing them here would mean a
 * fetch per open; until that exists, "View full details" is the honest route
 * to them rather than a half-filled spec list.
 */
export function QuickView({
  product,
  open,
  onClose,
}: {
  product: ProductCardData;
  open: boolean;
  onClose: () => void;
}) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset between openings, or a failed add still shows its error next time.
  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const soldOut = product.stockLabel === "SOLD_OUT";
  const firstStocked =
    product.colors.find((c) =>
      product.variants.some((v) => v.color === c.name && v.stock > 0),
    )?.name ?? product.colors[0]?.name;
  const sizes = product.variants
    .filter((v) => v.color === firstStocked)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  function add(variantId: string) {
    setAddingId(variantId);
    setError(null);
    const sku = product.variants.find((v) => v.id === variantId)?.sku;
    addItem(variantId)
      .then(() => {
        if (sku?.trim()) {
          track("ADD_TO_CART", {
            productId: product.id,
            contentId: sku,
            value: product.price / 100,
          });
        }
        onClose();
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not add to cart."),
      )
      .finally(() => setAddingId(null));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-paper/40 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${product.name}`}
        >
          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto grid w-full max-w-3xl gap-0 border border-paper/15 bg-ink shadow-2xl sm:grid-cols-2"
          >
            <div className="relative hidden aspect-[3/4] bg-ink-2 sm:block">
              {product.image && (
                <Image
                  src={product.image.url}
                  alt={product.image.alt}
                  fill
                  sizes="(max-width: 640px) 0px, 384px"
                  className="object-cover object-top"
                />
              )}
            </div>

            <div className="flex flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="display pr-2 text-xl leading-tight sm:text-2xl">
                  {amp(product.name)}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close quick view"
                  className="-mr-1 -mt-1 shrink-0 p-1 hover:text-blood"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Only when a real review exists - the card applies the same
                  guard, and an invented average is a schema violation. */}
              {product.ratingCount > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-paper-dim">
                  <Star size={12} className="fill-volt text-volt" />
                  {product.ratingAvg.toFixed(1)}
                  <span>
                    ({product.ratingCount}{" "}
                    {product.ratingCount === 1 ? "review" : "reviews"})
                  </span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="display text-2xl text-paper">
                  {formatPrice(product.price)}
                </span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-sm text-paper-dim line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-semibold text-blood">
                      {product.discountPercent}% off
                    </span>
                  </>
                )}
              </div>

              {product.colors.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-paper-dim">
                    {product.colors.length === 1
                      ? "Colour"
                      : `${product.colors.length} colours`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.colors.map((c) => (
                      <span
                        key={c.name}
                        title={c.name}
                        className="h-4 w-4 rounded-full border border-paper/25"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                {soldOut || sizes.length === 0 ? (
                  <p className="border border-paper/15 py-3 text-center text-sm text-paper-dim">
                    Sold out
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-paper-dim">
                      Add to bag
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizes.map((v) => (
                        <button
                          key={v.id}
                          disabled={v.stock === 0 || addingId !== null}
                          onClick={() => add(v.id)}
                          className={cn(
                            "display min-w-16 border px-4 py-2.5 text-sm transition-colors",
                            v.stock === 0
                              ? "cursor-not-allowed border-paper/10 text-paper-dim line-through"
                              : "border-paper/25 text-paper hover:border-volt hover:bg-volt hover:text-ink",
                          )}
                        >
                          {addingId === v.id ? (
                            <Loader2
                              size={14}
                              className="mx-auto animate-spin"
                            />
                          ) : (
                            sizeLabel(v.size)
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {error && <p className="mt-2 text-sm text-blood">{error}</p>}
              </div>

              {/* Read from BUSINESS.policy so these can never drift from what
                  the cart charges and the returns flow accepts. */}
              <ul className="mt-5 space-y-1.5 border-t border-paper/10 pt-4 text-xs text-paper-dim">
                <li className="flex items-center gap-2">
                  <BadgeIndianRupee size={14} className="shrink-0 text-volt" />
                  Cash on Delivery available
                </li>
                <li className="flex items-center gap-2">
                  <Truck size={14} className="shrink-0 text-volt" />
                  Free shipping over ₹{BUSINESS.policy.freeShippingOver} ·
                  Dispatched in {BUSINESS.policy.dispatchDays}
                </li>
                <li className="flex items-center gap-2">
                  <RotateCcw size={14} className="shrink-0 text-volt" />
                  {BUSINESS.policy.returnWindowDays}-day returns on unused items
                </li>
              </ul>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="mt-4 inline-block border-b border-volt pb-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-volt transition-colors hover:text-paper"
              >
                View full details
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
