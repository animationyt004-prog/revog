import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, CheckCircle2, MapPin, Package } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { formatPrice } from "@/lib/format";
import type { OrderData } from "@/lib/types";

const API = process.env.API_URL ?? "http://localhost:3001/api";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };

interface Props {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}

async function getOrder(orderNumber: string, email?: string): Promise<OrderData | null> {
  try {
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    const res = await fetch(`${API}/orders/${orderNumber}${qs}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OrderData;
  } catch {
    return null;
  }
}

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { email }] = await Promise.all([params, searchParams]);
  const order = await getOrder(orderNumber, email);
  if (!order) notFound();

  const addr = order.addressSnapshot;

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {/* Confirmation header */}
        <div className="text-center">
          <CheckCircle2 size={56} className="mx-auto text-volt" strokeWidth={1.5} />
          <h1 className="display mt-4 text-4xl sm:text-5xl">
            Order <span className="text-volt">Confirmed.</span>
          </h1>
          <p className="mt-2 text-sm text-paper-dim">
            Order <strong className="text-paper">{order.orderNumber}</strong> · confirmation sent to{" "}
            {order.email}
          </p>
        </div>

        {/* COD reminder */}
        <div className="mt-8 flex items-center gap-3 border border-volt/40 bg-volt/10 p-4">
          <Banknote size={22} className="shrink-0 text-volt" />
          <p className="text-sm">
            <strong>Cash on Delivery</strong> — keep{" "}
            <strong>{formatPrice(order.total)}</strong> ready. Our courier accepts cash & UPI at the
            door.
          </p>
        </div>

        {/* Items */}
        <section className="mt-8 border border-paper/10">
          <h2 className="display flex items-center gap-2 border-b border-paper/10 px-4 py-3 text-xl">
            <Package size={18} className="text-volt" /> Items
          </h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 border-b border-paper/5 px-4 py-3 last:border-0">
              <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-ink-2">
                {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.productName}</p>
                <p className="text-xs text-paper-dim">
                  {i.variantLabel} × {i.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(i.lineTotal)}</p>
            </div>
          ))}
          <dl className="space-y-1 bg-ink-2 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-volt">
                <dt>Coupon {order.couponCode}</dt>
                <dd>-{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between text-xs text-paper-dim">
              <dt>Includes GST</dt>
              <dd>{formatPrice(order.taxAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-paper/10 pt-1.5 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* Address */}
        <section className="mt-6 border border-paper/10 p-4">
          <h2 className="display mb-2 flex items-center gap-2 text-xl">
            <MapPin size={18} className="text-volt" /> Delivering To
          </h2>
          <p className="text-sm font-semibold">
            {addr.fullName} · {addr.phone}
          </p>
          <p className="mt-1 text-sm text-paper-dim">
            {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
          </p>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="display bg-volt px-6 py-3 text-lg text-ink transition-transform hover:-translate-y-0.5">
            Keep Shopping
          </Link>
          <Link
            href="/account/orders"
            className="display border border-paper/30 px-6 py-3 text-lg transition-colors hover:border-volt hover:text-volt"
          >
            My Orders
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
