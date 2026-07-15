"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, PackageOpen } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";
import type { OrderData } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-volt/15 text-volt border-volt/40",
  PACKED: "bg-volt/15 text-volt border-volt/40",
  SHIPPED: "bg-ink-3 text-paper border-paper/30",
  DELIVERED: "bg-ink-3 text-paper border-paper/30",
  CANCELLED: "bg-blood/10 text-blood border-blood/40",
  PENDING: "bg-ink-3 text-paper-dim border-paper/20",
};

export function OrdersView() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [orders, setOrders] = useState<OrderData[] | null>(null);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
    if (status !== "authed") return;
    authedFetch("/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: OrderData[]) => setOrders(data))
      .catch(() => setOrders([]));
  }, [status, router]);

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="display text-4xl sm:text-5xl">
          My Orders<span className="text-volt">.</span>
        </h1>

        {orders === null ? (
          <div className="grid place-items-center py-24">
            <Loader2 size={28} className="animate-spin text-volt" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <PackageOpen size={48} className="mx-auto text-paper-dim" strokeWidth={1.2} />
            <p className="display mt-4 text-2xl text-paper-dim">No orders yet.</p>
            <Link href="/" className="display mt-5 inline-block bg-volt px-6 py-3 text-lg text-ink">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o, idx) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
              >
                <Link
                  href={`/order/${o.orderNumber}?email=${encodeURIComponent(user?.email ?? "")}`}
                  className="group block border border-paper/10 p-4 transition-colors hover:border-volt"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <span
                      className={cn(
                        "display border px-2 py-0.5 text-xs",
                        STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING,
                      )}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-paper-dim">
                    {new Date(o.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {o.paymentMethod} · {o.items.length} item{o.items.length > 1 ? "s" : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {o.items.slice(0, 4).map((i) => (
                      <div key={i.id} className="relative aspect-[3/4] w-10 overflow-hidden bg-ink-2">
                        {i.image && <Image src={i.image} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                    ))}
                    {o.items.length > 4 && (
                      <span className="text-xs text-paper-dim">+{o.items.length - 4}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-sm font-bold">
                      {formatPrice(o.total)}
                      <ChevronRight size={15} className="text-paper-dim transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
