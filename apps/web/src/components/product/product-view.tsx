"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, RotateCcw, Star, Truck } from "lucide-react";
import { cn, formatPrice, sizeLabel } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { pixelTrack } from "@/lib/pixel";
import { track } from "@/lib/track";
import { AvailableOffers } from "@/components/product/available-offers";
import { ProductSpecs } from "@/components/product/product-specs";
import type { ProductDetail } from "@/lib/types";
import { PincodeChecker } from "./pincode-checker";
import { ProductLightbox } from "./product-lightbox";
import { SizeGuideModal } from "./size-guide";

const SIZE_ORDER = ["FREE_SIZE", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
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
  const [zoomOpen, setZoomOpen] = useState(false);
  const addItem = useCart((s) => s.addItem);
  // Comes from the cart summary so the banner can never quote a rate the
  // server no longer applies. An empty cart still carries the percentage.
  const prepaidPercent = useCart((s) => s.cart?.summary.prepaidPercent ?? 0);
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  // The sticky bar is a second copy of the buy action, so it only appears once
  // the real one has scrolled away — two live buttons on screen at once is
  // just noise.
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Add, then go straight to checkout. Same guard as Add To Cart: without a
   *  size there is nothing to buy. */
  function buyNow() {
    if (!selectedVariant || buying) return;
    setBuying(true);
    setCartError(null);
    addItem(selectedVariant.id)
      .then(() => {
        track("ADD_TO_CART", { productId: product.id });
        router.push("/checkout");
      })
      .catch((e) => {
        setCartError(e instanceof Error ? e.message : "Could not add to cart.");
        setBuying(false);
      });
  }

  // Meta Pixel: product view (for ad retargeting + optimization).
  useEffect(() => {
    pixelTrack("ViewContent", {
      content_ids: [product.slug],
      content_name: product.name,
      content_type: "product",
      value: product.price / 100,
      currency: "INR",
    });
    // First-party analytics: product view.
    track("PRODUCT_VIEW", { productId: product.id });
  }, [product.slug, product.name, product.price, product.id]);

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

  // Single-size products (e.g. free-size sarees): pre-select automatically
  // so the customer never has to "choose" a size that isn't a choice.
  useEffect(() => {
    const inStock = sizesForColor.filter((v) => v.stock > 0);
    if (inStock.length === 1) setSize(inStock[0].size);
  }, [sizesForColor]);

  function pickColor(name: string) {
    setColor(name);
    setSize(null);
    setImageIdx(0);
    setAdded(false);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:gap-8 sm:px-6 sm:py-6 lg:grid-cols-2 lg:gap-12 lg:py-10">
      {/* ---------------- Gallery ---------------- */}
      {/* min-w-0 on both columns: a grid item defaults to min-width:auto, so
          any stubborn child could otherwise widen the column past the screen. */}
      <div className="min-w-0">
        {/* The product name is dropped from the trail on phones — the h1
            repeats it two lines below anyway. It also can't be trusted to
            truncate: WebViews that skip the min-width:auto exception for
            overflow:hidden let it stretch the grid column, which is what was
            pushing the whole page sideways on Android. */}
        <nav className="mb-3 flex min-w-0 items-center gap-1 overflow-hidden text-xs text-paper-dim">
          <Link href="/" className="shrink-0 hover:text-paper">Home</Link>
          {product.category && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <Link
                href={`/category/${product.category.slug}`}
                className="shrink-0 hover:text-paper"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="hidden shrink-0 sm:block" />
          <span className="hidden min-w-0 truncate text-paper sm:inline">{product.name}</span>
        </nav>

        {/* Edge to edge on phones — the -mx-4 cancels the page padding so the
            photo runs the full width of the screen, which is the only size at
            which a border or weave actually reads. Tapping opens the viewer. */}
        <motion.div
          key={activeImage?.url}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="relative -mx-4 aspect-[3/4] overflow-hidden bg-ink-2 sm:mx-0"
        >
          {activeImage && (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Open photo full screen"
              className="absolute inset-0 block cursor-zoom-in"
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </button>
          )}
          {discount > 0 && (
            <span className="display pointer-events-none absolute left-3 top-3 bg-blood px-2.5 py-1 text-sm">
              -{discount}%
            </span>
          )}
        </motion.div>

        {galleryImages.length > 1 && (
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-0 sm:mt-3">
            {galleryImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setImageIdx(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-ink-2 transition-opacity sm:w-20",
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
      <div className="min-w-0 lg:pt-8">
        <p className="text-xs font-semibold tracking-[0.25em] text-volt">
          {product.brand.toUpperCase()} · {product.fit}
        </p>
        <h1 className="display mt-2 text-2xl leading-snug sm:text-5xl sm:leading-tight">{product.name}</h1>

        {product.ratingCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 bg-ink-3 px-2 py-0.5">
              <Star size={13} className="fill-volt text-volt" />
              {product.ratingAvg.toFixed(1)}
            </span>
            <span className="text-paper-dim">{product.ratingCount} reviews · {product.soldCount}+ sold</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:mt-5">
          <span className="text-2xl font-bold sm:text-3xl">{formatPrice(price)}</span>
          {discount > 0 && (
            <>
              <span className="text-lg text-paper-dim line-through">{formatPrice(product.mrp)}</span>
              <span className="font-semibold text-blood">({discount}% OFF)</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-paper-dim">MRP inclusive of all taxes</p>

        {/* Color picker */}
        <div className="mt-5 sm:mt-7">
          <p className="mb-2.5 text-sm font-semibold">
            Colour: <span className="text-paper-dim">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
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
        <div className="mt-5 sm:mt-6">
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
                {sizeLabel(v.size)}
              </button>
            ))}
          </div>
          {selectedVariant && selectedVariant.stock <= 5 && (
            <p className="mt-2 text-xs font-semibold text-blood">
              Hurry — only {selectedVariant.stock} left in {color} / {sizeLabel(size ?? "")}
            </p>
          )}
        </div>

        <button
          ref={addToCartRef}
          onClick={() => {
            if (!selectedVariant) return;
            setAdding(true);
            setCartError(null);
            addItem(selectedVariant.id)
              .then(() => {
                setAdded(true);
                track("ADD_TO_CART", { productId: product.id });
              })
              .catch((e) =>
                setCartError(e instanceof Error ? e.message : "Could not add to cart."),
              )
              .finally(() => setAdding(false));
          }}
          disabled={!size || adding}
          className={cn(
            "display mt-5 flex w-full items-center justify-center gap-2 py-3 text-base transition-all sm:mt-8 sm:py-4 sm:text-xl",
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
        <div className="mt-5 grid grid-cols-1 gap-2 text-xs text-paper-dim sm:mt-6 sm:grid-cols-2 sm:gap-3">
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

        {zoomOpen && (
          <ProductLightbox
            images={galleryImages}
            index={Math.min(imageIdx, galleryImages.length - 1)}
            onIndex={setImageIdx}
            onClose={() => setZoomOpen(false)}
            alt={activeImage?.alt ?? product.name}
          />
        )}

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
          <AvailableOffers />

          <ProductSpecs product={product} />
        </div>
      </div>

      {/* Sticky buy bar. Appears once the real Add To Cart has scrolled past,
          so the action is always one tap away on a long product page. */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/10 bg-ink/95 backdrop-blur-sm">
          {prepaidPercent > 0 && (
            <p className="bg-night px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-gold sm:text-xs">
              Get {prepaidPercent}% extra off on prepaid orders
            </p>
          )}
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-paper-dim">{product.name}</p>
              <p className="text-sm font-bold text-paper">
                {formatPrice(price)}
                {discount > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-paper-dim line-through">
                    {formatPrice(product.mrp)}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={buyNow}
              disabled={!size || buying}
              className={cn(
                "display shrink-0 px-6 py-2.5 text-base transition-all sm:px-9 sm:text-lg",
                size && !buying
                  ? "bg-volt text-ink hover:-translate-y-0.5"
                  : "cursor-not-allowed bg-ink-3 text-paper-dim",
              )}
            >
              {buying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : size ? (
                "Buy It Now"
              ) : (
                "Select A Size"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
