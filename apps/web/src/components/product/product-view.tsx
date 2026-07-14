"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, RotateCcw, Star, Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import type { ProductDetail } from "@/lib/types";
import { PincodeChecker } from "./pincode-checker";
import { SizeGuideModal } from "./size-guide";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const BOTTOM_CATEGORIES = new Set(["cargos", "joggers"]);

export function ProductView({ product }: { product: ProductDetail }) {
  const colors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const v of product.variants) {
      if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
    }
    return [...seen].map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  // Default to the first color that has any stock.
  const [color, setColor] = useState(() => {
    const inStock = colors.find((c) =>
      product.variants.some((v) => v.color === c.name && v.stock > 0),
    );
    return (inStock ?? colors[0])?.name ?? "";
  });
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const galleryImages = useMemo(() => {
    const forColor = product.images.filter((i) => i.color === color);
    return forColor.length > 0 ? forColor : product.images;
  }, [product.images, color]);
  const [imageIdx, setImageIdx] = useState(0);
  const activeImage = galleryImages[Math.min(imageIdx, galleryImages.length - 1)];

  const sizesForColor = useMemo(
    () =>
      product.variants
        .filter((v) => v.color === color)
        .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    [product.variants, color],
  );
  const selectedVariant = sizesForColor.find((v) => v.size === size) ?? null;
  const price = selectedVariant?.priceOverride ?? product.price;
  const discount =
    product.mrp > price ? Math.round((1 - price / product.mrp) * 100) : 0;

  function pickColor(name: string) {
    setColor(name);
    setSize(null);
    setImageIdx(0);
    setAdded(false);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-10">
      {/* ---------------- Gallery ---------------- */}
      <div>
        <nav className="mb-3 flex items-center gap-1 text-xs text-paper-dim">
          <Link href="/" className="hover:text-paper">Home</Link>
          <ChevronRight size={12} />
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="hover:text-paper">
                {product.category.name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="truncate text-paper">{product.name}</span>
        </nav>

        <motion.div
          key={activeImage?.url}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="relative aspect-[3/4] overflow-hidden bg-ink-2"
        >
          {activeImage && (
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          {discount > 0 && (
            <span className="display absolute left-3 top-3 bg-blood px-2.5 py-1 text-sm">
              -{discount}%
            </span>
          )}
        </motion.div>

        {galleryImages.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {galleryImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setImageIdx(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-ink-2 transition-opacity",
                  i === imageIdx ? "ring-2 ring-volt" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Info panel ---------------- */}
      <div className="lg:pt-8">
        <p className="text-xs font-semibold tracking-[0.25em] text-volt">
          {product.brand.toUpperCase()} · {product.fit}
        </p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">{product.name}</h1>

        {product.ratingCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 bg-ink-3 px-2 py-0.5">
              <Star size={13} className="fill-volt text-volt" />
              {product.ratingAvg.toFixed(1)}
            </span>
            <span className="text-paper-dim">{product.ratingCount} reviews · {product.soldCount}+ sold</span>
          </div>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          {discount > 0 && (
            <>
              <span className="text-lg text-paper-dim line-through">{formatPrice(product.mrp)}</span>
              <span className="font-semibold text-blood">({discount}% OFF)</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-paper-dim">MRP inclusive of all taxes</p>

        {/* Color picker */}
        <div className="mt-7">
          <p className="mb-2.5 text-sm font-semibold">
            Colour: <span className="text-paper-dim">{color}</span>
          </p>
          <div className="flex gap-2.5">
            {colors.map((c) => (
              <button
                key={c.name}
                title={c.name}
                aria-label={`Colour ${c.name}`}
                onClick={() => pickColor(c.name)}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                  c.name === color ? "border-volt" : "border-paper/25",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Size picker */}
        <div className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-semibold">Size</p>
            <button
              onClick={() => setGuideOpen(true)}
              className="text-xs text-paper-dim underline hover:text-volt"
            >
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((v) => (
              <button
                key={v.id}
                disabled={v.stock === 0}
                onClick={() => { setSize(v.size); setAdded(false); }}
                className={cn(
                  "display min-w-12 border px-3 py-2.5 text-base transition-colors",
                  v.size === size
                    ? "border-volt bg-volt text-ink"
                    : "border-paper/30 hover:border-paper",
                  v.stock === 0 &&
                    "cursor-not-allowed border-paper/10 text-paper/25 line-through hover:border-paper/10",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
          {selectedVariant && selectedVariant.stock <= 5 && (
            <p className="mt-2 text-xs font-semibold text-blood">
              Hurry — only {selectedVariant.stock} left in {color} / {size}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            if (!selectedVariant) return;
            setAdding(true);
            setCartError(null);
            addItem(selectedVariant.id)
              .then(() => setAdded(true))
              .catch((e) =>
                setCartError(e instanceof Error ? e.message : "Could not add to cart."),
              )
              .finally(() => setAdding(false));
          }}
          disabled={!size || adding}
          className={cn(
            "display mt-8 flex w-full items-center justify-center gap-2 py-4 text-xl transition-all",
            size
              ? "bg-volt text-ink hover:-translate-y-0.5"
              : "cursor-not-allowed bg-ink-3 text-paper-dim",
          )}
        >
          {adding ? (
            <Loader2 size={20} className="animate-spin" />
          ) : added ? (
            "✓ Added — Add Again?"
          ) : size ? (
            "Add To Cart"
          ) : (
            "Select A Size"
          )}
        </button>
        {cartError && <p className="mt-2 text-sm text-blood">{cartError}</p>}

        {/* Delivery strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-paper-dim">
          <div className="flex items-center gap-2 border border-paper/10 p-3">
            <Truck size={16} className="shrink-0 text-volt" />
            Free shipping over ₹999 · COD available
          </div>
          <div className="flex items-center gap-2 border border-paper/10 p-3">
            <RotateCcw size={16} className="shrink-0 text-volt" />
            Easy 7-day returns & exchanges
          </div>
        </div>

        <PincodeChecker />

        <SizeGuideModal
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          kind={BOTTOM_CATEGORIES.has(product.category?.slug ?? "") ? "bottom" : "top"}
        />

        {/* Details */}
        <div className="mt-8 space-y-5 border-t border-paper/10 pt-6 text-sm leading-relaxed text-paper-dim">
          <div>
            <h2 className="display mb-1.5 text-lg text-paper">The Story</h2>
            <p>{product.description}</p>
          </div>
          {product.fabric && (
            <div>
              <h2 className="display mb-1.5 text-lg text-paper">Fabric & Fit</h2>
              <p>
                {product.fabric} · {product.fit.charAt(0) + product.fit.slice(1).toLowerCase()} fit ·
                Model wears size L
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
