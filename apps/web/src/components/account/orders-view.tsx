"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, PackageOpen } from "lucide-react";
import { AccountTabs } from "@/components/account/account-tabs";
import {
  AccountSessionLoading,
  useAccountSession,
} from "@/components/account/account-session";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { authedFetch } from "@/lib/auth-store";
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
  const { ready, status, user } = useAccountSession("/account/orders");
  const [orders, setOrders] = useState<OrderData[] | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    authedFetch("/orders")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: OrderData[]) => setOrders(data))
      .catch(() => setOrders([]));
  }, [status]);

  if (!ready || !user) {
    return <AccountSessionLoading nextPath="/account/orders" />;
  }

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="flex-1 bg-ink">
        <section className="border-b border-paper/10 bg-night text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <p className="text-xs font-semibold uppercase text-white/55">
              Purchase history
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h1 className="display text-4xl sm:text-5xl">
                Your orders<span className="text-volt">.</span>
              </h1>
              <p className="max-w-md text-sm leading-6 text-white/55">
                Review every purchase, open its details, and follow delivery
                progress.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <AccountTabs />

          {orders === null ? (
            <div className="grid place-items-center py-24">
              <Loader2 size={28} className="animate-spin text-volt" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center">
              <PackageOpen
                size={48}
                className="mx-auto text-paper-dim"
                strokeWidth={1.2}
              />
              <p className="display mt-4 text-2xl">No orders yet.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-paper-dim">
                Your purchases will appear here with delivery updates and order
                details.
              </p>
              <Link
                href="/collections/sarees"
                className="mt-5 inline-flex h-11 items-center bg-volt px-6 text-sm font-semibold text-white"
              >
                Explore sarees
              </Link>
            </div>
          ) : (
            <section className="py-9 sm:py-12">
              <div className="flex items-end justify-between gap-4 border-b border-paper/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-volt">
                    All purchases
                  </p>
                  <h2 className="display mt-1 text-3xl">
                    {orders.length} order{orders.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <p className="hidden text-xs text-paper-dim sm:block">
                  Most recent first
                </p>
              </div>

              <div>
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={`/order/${order.orderNumber}?email=${encodeURIComponent(user?.email ?? "")}`}
                      className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-paper/10 py-5 transition-colors hover:border-volt/50 sm:grid-cols-[76px_1fr_150px_auto]"
                    >
                      <div className="relative aspect-[3/4] w-16 overflow-hidden bg-ink-2 sm:w-[76px]">
                        {order.items[0]?.image && (
                          <Image
                            src={order.items[0].image}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 76px, 64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        )}
                        {order.items.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-night/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            +{order.items.length - 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-volt">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-xs text-paper-dim">
                          {new Date(order.placedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                          {" / "}
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 truncate text-xs text-paper-dim sm:hidden">
                          {order.paymentMethod}
                        </p>
                        <span
                          className={cn(
                            "mt-2 inline-flex border px-2 py-0.5 text-[10px] font-semibold",
                            STATUS_STYLES[order.status] ??
                              STATUS_STYLES.PENDING,
                          )}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="hidden sm:block">
                        <p className="text-xs text-paper-dim">Payment</p>
                        <p className="mt-1 text-sm font-medium">
                          {order.paymentMethod}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(order.total)}
                        </p>
                        <ChevronRight
                          size={17}
                          className="ml-auto mt-3 text-paper-dim transition-transform group-hover:translate-x-1 group-hover:text-volt"
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
