"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { AccountTabs } from "@/components/account/account-tabs";
import {
  AccountSessionLoading,
  useAccountSession,
} from "@/components/account/account-session";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { amp } from "@/components/typography";
import { authedFetch } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";
import { orderHref } from "@/lib/order-link";

interface CustomerReturn {
  id: string;
  reason: string;
  status: string;
  refundAmount: number | null;
  createdAt: string;
  order: { orderNumber: string; email: string; total: number; viewToken?: string };
  orderItem: {
    productName: string;
    variantLabel: string;
    image: string | null;
  } | null;
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "border-volt/40 bg-volt/10 text-volt",
  APPROVED: "border-volt/40 bg-volt/10 text-volt",
  RECEIVED: "border-paper/25 bg-ink-3 text-paper",
  REFUNDED: "border-paper/25 bg-ink-3 text-paper",
  REJECTED: "border-blood/40 bg-blood/10 text-blood",
};

export default function AccountReturnsPage() {
  const { ready, status } = useAccountSession("/account/returns");
  const [items, setItems] = useState<CustomerReturn[] | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    authedFetch("/returns")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: CustomerReturn[]) => setItems(data))
      .catch(() => setItems([]));
  }, [status]);

  if (!ready) {
    return <AccountSessionLoading nextPath="/account/returns" />;
  }

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="flex-1 bg-ink">
        <section className="border-b border-paper/10 bg-night text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <p className="text-xs font-semibold uppercase text-white/55">
              Client aftercare
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h1 className="display text-4xl sm:text-5xl">
                {amp("Returns & refunds")}
                <span className="text-volt">.</span>
              </h1>
              <p className="max-w-md text-sm leading-6 text-white/55">
                Follow each request from review through approval and refund.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <AccountTabs />

          {items === null ? (
            <div className="grid place-items-center py-24">
              <Loader2 size={27} className="animate-spin text-volt" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <RotateCcw
                size={44}
                strokeWidth={1.2}
                className="mx-auto text-paper-dim"
              />
              <p className="display mt-4 text-2xl">No return requests.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-paper-dim">
                Eligible delivered orders can be returned from their order
                details page.
              </p>
              <Link
                href="/account/orders"
                className="mt-5 inline-flex h-11 items-center bg-volt px-5 text-sm font-semibold text-white"
              >
                View orders
              </Link>
            </div>
          ) : (
            <section className="py-9 sm:py-12">
              <div className="flex items-end justify-between gap-4 border-b border-paper/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-volt">
                    Request history
                  </p>
                  <h2 className="display mt-1 text-3xl">
                    {items.length} request{items.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <p className="hidden text-xs text-paper-dim sm:block">
                  Latest updates
                </p>
              </div>

              <div>
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[64px_1fr] gap-4 border-b border-paper/10 py-5 sm:grid-cols-[76px_1fr_auto]"
                  >
                    <div className="relative aspect-[3/4] w-16 overflow-hidden bg-ink-2 sm:w-[76px]">
                      {item.orderItem?.image && (
                        <Image
                          src={item.orderItem.image}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 76px, 64px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={orderHref(item.order, item.order.email)}
                          className="text-sm font-semibold hover:text-volt"
                        >
                          {item.order.orderNumber}
                        </Link>
                        <span
                          className={cn(
                            "border px-2 py-0.5 text-[10px] font-semibold",
                            STATUS_STYLE[item.status] ?? STATUS_STYLE.REQUESTED,
                          )}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium">
                        {item.orderItem?.productName ?? "Entire order"}
                      </p>
                      {item.orderItem && (
                        <p className="mt-0.5 text-xs text-paper-dim">
                          {item.orderItem.variantLabel}
                        </p>
                      )}
                      <p className="mt-2 text-xs leading-5 text-paper-dim">
                        {item.reason} / Requested{" "}
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-2 text-sm font-semibold sm:hidden">
                        Refund{" "}
                        {formatPrice(item.refundAmount ?? item.order.total)}
                      </p>
                    </div>

                    <div className="hidden min-w-32 text-right sm:block">
                      <p className="text-xs text-paper-dim">Refund value</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatPrice(item.refundAmount ?? item.order.total)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
