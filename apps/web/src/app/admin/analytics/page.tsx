"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Loader2, MousePointerClick, RefreshCw, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn } from "@/lib/format";

interface Funnel {
  days: number;
  visitors: number;
  returningVisitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  orders: number;
  viewToCartRate: number;
  cartToOrderRate: number;
  topProducts: { productId: string | null; name: string; slug: string; views: number }[];
}

const RANGES = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authedFetch(`/admin/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const stats = data
    ? [
        { label: "Visitors", value: data.visitors, icon: Users },
        { label: "Returning", value: data.returningVisitors, icon: RefreshCw },
        { label: "Page Views", value: data.pageViews, icon: Eye },
        { label: "Product Views", value: data.productViews, icon: Eye },
        { label: "Add to Cart", value: data.addToCarts, icon: ShoppingCart },
        { label: "Orders", value: data.orders, icon: ShoppingBag },
      ]
    : [];

  // Funnel bars scaled to the widest stage.
  const funnel = data
    ? [
        { label: "Visitors", value: data.visitors, icon: Users },
        { label: "Product Views", value: data.productViews, icon: Eye },
        { label: "Add to Cart", value: data.addToCarts, icon: ShoppingCart },
        { label: "Orders", value: data.orders, icon: ShoppingBag },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl sm:text-4xl">
          Traffic<span className="text-volt">.</span>
        </h1>
        <div className="flex gap-1 border border-paper/15 p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "px-3 py-1 text-xs transition-colors",
                days === r.days ? "bg-volt text-ink" : "text-paper-dim hover:text-paper",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} className="animate-spin text-volt" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="border border-paper/10 bg-ink-2 p-4">
                <s.icon size={18} className="text-volt" />
                <p className="display mt-2 text-2xl sm:text-3xl">{s.value.toLocaleString("en-IN")}</p>
                <p className="text-xs text-paper-dim">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <section className="mt-8 border border-paper/10">
            <h2 className="display border-b border-paper/10 px-4 py-3 text-xl">
              Conversion Funnel
              <span className="ml-2 text-xs font-normal text-paper-dim">
                view→cart {data.viewToCartRate}% · cart→order {data.cartToOrderRate}%
              </span>
            </h2>
            <div className="space-y-3 p-4">
              {funnel.map((f) => (
                <div key={f.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <f.icon size={14} className="text-volt" /> {f.label}
                    </span>
                    <span className="font-semibold">{f.value.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2.5 w-full bg-ink-3">
                    <div
                      className="h-full bg-volt transition-all"
                      style={{ width: `${Math.max(2, (f.value / funnelMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top viewed products */}
          <section className="mt-6 border border-paper/10">
            <h2 className="display flex items-center gap-2 border-b border-paper/10 px-4 py-3 text-xl">
              <MousePointerClick size={17} className="text-volt" /> Most Viewed Products
            </h2>
            {data.topProducts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-paper-dim">No product views yet.</p>
            ) : (
              data.topProducts.map((p) => (
                <Link
                  key={p.productId ?? p.name}
                  href={p.slug ? `/products/${p.slug}` : "#"}
                  className="flex items-center justify-between border-b border-paper/5 px-4 py-2.5 text-sm last:border-0 hover:bg-ink-2"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 text-paper-dim">{p.views} views</span>
                </Link>
              ))
            )}
          </section>

          <p className="mt-4 text-xs text-paper-dim">
            First-party data from your storefront. Full detail (sources, geography) lives in Google
            Analytics once its tag is configured.
          </p>
        </>
      )}
    </div>
  );
}
