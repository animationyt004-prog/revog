"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";

export function CartDrawer() {
  const router = useRouter();
  const { cart, drawerOpen, busy, closeDrawer, updateQuantity, removeItem, applyCoupon, removeCoupon } =
    useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  // Lock page scroll while open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const summary = cart?.summary;
  const empty = !cart || cart.items.length === 0;

  async function submitCoupon() {
    setCouponError(null);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : "Invalid coupon.");
    }
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[70] bg-paper/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-ink shadow-2xl"
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4">
              <h2 className="display flex items-center gap-2 text-2xl">
                <ShoppingBag size={20} />
                Your Cart
                {summary && summary.itemCount > 0 && (
                  <span className="text-base text-paper-dim">({summary.itemCount})</span>
                )}
              </h2>
              <button onClick={closeDrawer} aria-label="Close cart" className="p-1 hover:text-blood">
                <X size={22} />
              </button>
            </div>

            {empty ? (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <div>
                  <p className="display text-3xl text-paper-dim">Bag&apos;s empty.</p>
                  <p className="mt-2 text-sm text-paper-dim">The streets are waiting.</p>
                  <button
                    onClick={closeDrawer}
                    className="display mt-6 bg-volt px-6 py-3 text-lg text-ink"
                  >
                    Keep Shopping
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                {summary && summary.amountToFreeShipping > 0 ? (
                  <div className="border-b border-paper/10 px-5 py-3">
                    <p className="text-xs">
                      Add <strong>{formatPrice(summary.amountToFreeShipping)}</strong> more for{" "}
                      <span className="font-semibold text-volt">FREE shipping</span>
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
                      <div
                        className="h-full bg-volt transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((summary.freeShippingThreshold - summary.amountToFreeShipping) / summary.freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="border-b border-paper/10 px-5 py-3 text-xs font-semibold text-volt">
                    ✓ You&apos;ve unlocked FREE shipping
                  </p>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-paper/10 py-4">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeDrawer}
                        className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-ink-2"
                      >
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        )}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="mt-0.5 text-xs text-paper-dim">
                              {item.color} / {item.size}
                            </p>
                          </div>
                          <button
                            onClick={() => void removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1 text-paper-dim hover:text-blood"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          {/* Qty stepper */}
                          <div className="flex items-center border border-paper/25">
                            <button
                              onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                              disabled={busy}
                              aria-label="Decrease quantity"
                              className="grid h-7 w-7 place-items-center hover:bg-ink-2"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                              disabled={busy || item.quantity >= Math.min(item.stock, 10)}
                              aria-label="Increase quantity"
                              className="grid h-7 w-7 place-items-center hover:bg-ink-2 disabled:opacity-40"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <p className="text-sm">
                            <span className="font-semibold">{formatPrice(item.lineTotal)}</span>{" "}
                            {item.mrp > item.unitPrice && (
                              <span className="text-xs text-paper-dim line-through">
                                {formatPrice(item.mrp * item.quantity)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Coupon */}
                  <div className="py-4">
                    {summary?.couponCode ? (
                      <div className="flex items-center justify-between border border-volt/40 bg-volt/10 px-3 py-2.5">
                        <p className="flex items-center gap-2 text-sm">
                          <Tag size={14} className="text-volt" />
                          <strong>{summary.couponCode}</strong> applied — you save{" "}
                          {formatPrice(summary.couponDiscount)}
                        </p>
                        <button
                          onClick={() => void removeCoupon()}
                          className="text-xs text-paper-dim underline hover:text-blood"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => { e.preventDefault(); void submitCoupon(); }}
                      >
                        <input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                          placeholder="Coupon code (try REVOG10)"
                          aria-label="Coupon code"
                          className="w-full border border-paper/25 bg-ink-2 px-3 py-2.5 text-sm uppercase outline-none placeholder:normal-case focus:border-volt"
                        />
                        <button
                          type="submit"
                          disabled={busy || couponInput.trim().length < 3}
                          className="display border border-paper px-4 text-base transition-colors hover:bg-paper hover:text-ink disabled:opacity-40"
                        >
                          Apply
                        </button>
                      </form>
                    )}
                    {couponError && <p className="mt-2 text-xs text-blood">{couponError}</p>}
                  </div>
                </div>

                {/* Summary + CTA */}
                {summary && (
                  <div className="border-t border-paper/10 px-5 py-4">
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-paper-dim">
                        <dt>MRP total</dt>
                        <dd className="line-through">{formatPrice(summary.mrpTotal)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Subtotal</dt>
                        <dd>{formatPrice(summary.subtotal)}</dd>
                      </div>
                      {summary.couponDiscount > 0 && (
                        <div className="flex justify-between text-volt">
                          <dt>Coupon ({summary.couponCode})</dt>
                          <dd>-{formatPrice(summary.couponDiscount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt>Shipping</dt>
                        <dd className={cn(summary.shippingFee === 0 && "font-semibold text-volt")}>
                          {summary.shippingFee === 0 ? "FREE" : formatPrice(summary.shippingFee)}
                        </dd>
                      </div>
                      <div className="flex justify-between text-xs text-paper-dim">
                        <dt>Includes GST</dt>
                        <dd>{formatPrice(summary.taxIncluded)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-paper/10 pt-2 text-base font-bold">
                        <dt>Total</dt>
                        <dd>{formatPrice(summary.total)}</dd>
                      </div>
                      {summary.totalSavings > 0 && (
                        <p className="bg-volt/10 px-2 py-1.5 text-center text-xs font-semibold text-volt">
                          🎉 You&apos;re saving {formatPrice(summary.totalSavings)} on this order
                        </p>
                      )}
                    </dl>
                    <button
                      onClick={() => { closeDrawer(); router.push("/checkout"); }}
                      disabled={busy}
                      className="display mt-4 flex w-full items-center justify-center gap-2 bg-volt py-4 text-xl text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={20} className="animate-spin" /> : "Checkout"}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
