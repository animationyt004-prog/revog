"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, ChevronLeft, CreditCard, Loader2, Lock, MapPin } from "lucide-react";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { cn, formatPrice } from "@/lib/format";
import { pixelTrack } from "@/lib/pixel";
import { openRazorpay, type RazorpaySession } from "@/lib/razorpay";
import type { AddressData } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const FIELDS: { key: keyof AddressForm; label: string; span?: boolean; hint?: string }[] = [
  { key: "fullName", label: "Full Name", span: true },
  { key: "phone", label: "Mobile Number", hint: "10-digit, for delivery updates" },
  { key: "pincode", label: "Pincode" },
  { key: "line1", label: "Address (house no, street)", span: true },
  { key: "line2", label: "Landmark (optional)", span: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { status, user, accessToken } = useAuth();
  const { cart, fetchCart } = useCart();

  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saved, setSaved] = useState<AddressData[]>([]);
  const [method, setMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  // Meta Pixel: checkout started (fires once when the cart is known).
  const cartTotal = cart?.summary.total;
  useEffect(() => {
    if (cartTotal && cartTotal > 0) {
      pixelTrack("InitiateCheckout", { value: cartTotal / 100, currency: "INR" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on entry
  }, []);

  // Logged-in users: offer saved addresses.
  useEffect(() => {
    if (status !== "authed") return;
    authedFetch("/addresses")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AddressData[]) => {
        setSaved(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) prefill(def);
      })
      .catch(() => undefined);
  }, [status]);

  function prefill(a: AddressData) {
    setAddress({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
  }

  const summary = cart?.summary;
  const formOk =
    /\S+@\S+\.\S+/.test(email) &&
    address.fullName.length >= 2 &&
    /^[6-9]\d{9}$/.test(address.phone) &&
    address.line1.length >= 3 &&
    address.city.length >= 2 &&
    address.state.length >= 2 &&
    /^\d{6}$/.test(address.pincode);

  async function placeOrder() {
    if (!formOk || placing) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/orders/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          paymentMethod: method,
          email,
          address: { ...address, line2: address.line2 || undefined },
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : (data.message ?? "Could not place order."),
        );
      }
      const order = (await res.json()) as {
        orderNumber: string;
        razorpay: RazorpaySession | null;
      };

      // COD confirms server-side already — straight to the receipt.
      if (method === "COD" || !order.razorpay) {
        await fetchCart();
        router.replace(`/order/${order.orderNumber}?email=${encodeURIComponent(email)}`);
        return;
      }

      // Online: order is PENDING until Razorpay's signature is verified.
      const outcome = await openRazorpay(order.razorpay, {
        email,
        contact: address.phone,
        name: address.fullName,
      });

      if (outcome.kind === "success") {
        const verify = await fetch(`${API}/payments/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            razorpayOrderId: outcome.payload.razorpay_order_id,
            razorpayPaymentId: outcome.payload.razorpay_payment_id,
            razorpaySignature: outcome.payload.razorpay_signature,
          }),
        });
        if (!verify.ok) {
          throw new Error(
            "Payment taken but verification failed. Don't retry — contact us with order " +
              order.orderNumber,
          );
        }
        await fetchCart();
        router.replace(`/order/${order.orderNumber}?email=${encodeURIComponent(email)}`);
        return;
      }

      // Dismissed or failed: tell the API so the attempt is recorded, and let
      // the customer retry from the pending order.
      await fetch(`${API}/payments/failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          email,
          reason: outcome.kind === "failed" ? outcome.reason : "Payment window closed",
        }),
      }).catch(() => undefined);

      await fetchCart();
      setError(
        outcome.kind === "failed"
          ? `${outcome.reason} — order ${order.orderNumber} is saved, you can retry payment.`
          : `Payment cancelled. Order ${order.orderNumber} is saved — retry from My Orders, or pick Cash on Delivery.`,
      );
      setPlacing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order.");
      setPlacing(false);
    }
  }

  if (cart && cart.items.length === 0 && !placing) {
    return (
      <>
        <PromoTicker />
        <main className="grid min-h-svh place-items-center px-4 text-center">
          <div>
            <p className="display text-4xl text-paper-dim">Nothing to check out.</p>
            <Link href="/" className="display mt-6 inline-block bg-volt px-6 py-3 text-lg text-ink">
              Back to the store
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PromoTicker />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-sm text-paper-dim hover:text-paper">
            <ChevronLeft size={16} /> Continue shopping
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-paper-dim">
            <Lock size={13} className="text-volt" /> Secure checkout
          </p>
        </div>

        <h1 className="display text-4xl sm:text-5xl">
          Checkout<span className="text-volt">.</span>
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* ------------- Left: contact + address + payment ------------- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Contact */}
            <section>
              <h2 className="display mb-3 text-2xl">1. Contact</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "authed"}
                placeholder="you@example.com"
                aria-label="Email"
                className="w-full max-w-md border border-paper/25 bg-ink-2 px-3 py-3 text-sm outline-none focus:border-volt disabled:opacity-60"
              />
              {status !== "authed" && (
                <p className="mt-1.5 text-xs text-paper-dim">
                  Checking out as guest — order updates go to this email.{" "}
                  <Link href="/login" className="underline hover:text-volt">
                    Login instead?
                  </Link>
                </p>
              )}
            </section>

            {/* Address */}
            <section className="mt-8">
              <h2 className="display mb-3 text-2xl">2. Delivery Address</h2>

              {saved.length > 0 && (
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {saved.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => prefill(a)}
                      className={cn(
                        "border p-3 text-left text-xs transition-colors hover:border-volt",
                        address.line1 === a.line1 && address.pincode === a.pincode
                          ? "border-volt bg-volt/10"
                          : "border-paper/20",
                      )}
                    >
                      <p className="flex items-center gap-1 font-semibold">
                        <MapPin size={12} className="text-volt" />
                        {a.fullName} · {a.type}
                        {a.isDefault && <span className="text-volt">(default)</span>}
                      </p>
                      <p className="mt-1 text-paper-dim">
                        {a.line1}, {a.city} — {a.pincode}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className={cn("block", f.span && "sm:col-span-2")}>
                    <span className="mb-1 block text-xs font-semibold tracking-wide text-paper-dim">
                      {f.label.toUpperCase()}
                    </span>
                    <input
                      value={address[f.key]}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          [f.key]:
                            f.key === "phone" || f.key === "pincode"
                              ? e.target.value.replace(/\D/g, "")
                              : e.target.value,
                        }))
                      }
                      maxLength={f.key === "phone" ? 10 : f.key === "pincode" ? 6 : 120}
                      className="w-full border border-paper/25 bg-ink-2 px-3 py-2.5 text-sm outline-none focus:border-volt"
                    />
                    {f.hint && <span className="mt-0.5 block text-[11px] text-paper-dim">{f.hint}</span>}
                  </label>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section className="mt-8">
              <h2 className="display mb-3 text-2xl">3. Payment</h2>
              <div className="max-w-md space-y-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 border p-3.5 transition-colors ${
                    method === "RAZORPAY" ? "border-volt bg-volt/10" : "border-paper/15 hover:border-paper/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={method === "RAZORPAY"}
                    onChange={() => setMethod("RAZORPAY")}
                    className="accent-volt"
                  />
                  <CreditCard size={18} className={method === "RAZORPAY" ? "text-volt" : ""} />
                  <span className="text-sm font-semibold">UPI / Cards / Wallets</span>
                  <span className="ml-auto text-xs text-paper-dim">Pay now, securely</span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-3 border p-3.5 transition-colors ${
                    method === "COD" ? "border-volt bg-volt/10" : "border-paper/15 hover:border-paper/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={method === "COD"}
                    onChange={() => setMethod("COD")}
                    className="accent-volt"
                  />
                  <Banknote size={18} className={method === "COD" ? "text-volt" : ""} />
                  <span className="text-sm font-semibold">Cash on Delivery</span>
                  <span className="ml-auto text-xs text-paper-dim">Pay at your door</span>
                </label>
              </div>
            </section>
          </motion.div>

          {/* ------------- Right: order summary ------------- */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-fit border border-paper/10 bg-ink-2 p-5 lg:sticky lg:top-24"
          >
            <h2 className="display mb-4 text-2xl">Order Summary</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart?.items.map((i) => (
                <div key={i.id} className="flex gap-3">
                  <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-ink-3">
                    {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-paper-dim">
                      {i.color} / {i.size} × {i.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-semibold">{formatPrice(i.lineTotal)}</p>
                </div>
              ))}
            </div>

            {summary && (
              <dl className="mt-4 space-y-1.5 border-t border-paper/10 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(summary.subtotal)}</dd>
                </div>
                {summary.couponDiscount > 0 && (
                  <div className="flex justify-between text-volt">
                    <dt>Coupon {summary.couponCode}</dt>
                    <dd>-{formatPrice(summary.couponDiscount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{summary.shippingFee === 0 ? "FREE" : formatPrice(summary.shippingFee)}</dd>
                </div>
                <div className="flex justify-between text-xs text-paper-dim">
                  <dt>Includes GST</dt>
                  <dd>{formatPrice(summary.taxIncluded)}</dd>
                </div>
                <div className="flex justify-between border-t border-paper/10 pt-2 text-base font-bold">
                  <dt>To Pay (COD)</dt>
                  <dd>{formatPrice(summary.total)}</dd>
                </div>
              </dl>
            )}

            <button
              onClick={() => void placeOrder()}
              disabled={!formOk || placing}
              className={cn(
                "display mt-5 flex w-full items-center justify-center gap-2 py-4 text-xl transition-all",
                formOk && !placing
                  ? "bg-volt text-ink hover:-translate-y-0.5"
                  : "cursor-not-allowed bg-ink-3 text-paper-dim",
              )}
            >
              {placing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : method === "RAZORPAY" ? (
                cart ? `Pay ${formatPrice(cart.summary.total)}` : "Pay Now"
              ) : (
                "Place COD Order"
              )}
            </button>
            {error && (
              <p role="alert" className="mt-3 border border-blood/50 bg-blood/10 px-3 py-2 text-sm text-blood">
                {error}
              </p>
            )}
            <p className="mt-3 text-center text-[11px] text-paper-dim">
              By placing this order you agree to our terms & 7-day return policy.
            </p>
          </motion.aside>
        </div>
      </main>
    </>
  );
}
