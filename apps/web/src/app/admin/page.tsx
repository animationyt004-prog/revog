"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, IndianRupee, Loader2, ShoppingCart, Sunrise, Users } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";

interface Dashboard {
  revenue: number;
  orderCount: number;
  todayCount: number;
  customerCount: number;
  statusCounts: Record<string, number>;
  lowStock: {
    id: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    product: { name: string; slug: string };
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    email: string;
    status: string;
    paymentMethod: string;
    total: number;
    placedAt: string;
    _count: { items: number };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-volt border-volt/40 bg-volt/10",
  PACKED: "text-volt border-volt/40 bg-volt/10",
  SHIPPED: "text-paper border-paper/30 bg-ink-3",
  DELIVERED: "text-paper border-paper/30 bg-ink-3",
  CANCELLED: "text-blood border-blood/40 bg-blood/10",
  PENDING: "text-paper-dim border-paper/20 bg-ink-3",
};

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    authedFetch("/admin/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-volt" />
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: formatPrice(data.revenue), icon: IndianRupee },
    { label: "Total Orders", value: String(data.orderCount), icon: ShoppingCart },
    { label: "Orders Today", value: String(data.todayCount), icon: Sunrise },
    { label: "Customers", value: String(data.customerCount), icon: Users },
  ];

  return (
    <div>
      <h1 className="display text-3xl sm:text-4xl">
        Dashboard<span className="text-volt">.</span>
      </h1>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-paper/10 bg-ink-2 p-4">
            <s.icon size={18} className="text-volt" />
            <p className="display mt-2 text-2xl sm:text-3xl">{s.value}</p>
            <p className="text-xs text-paper-dim">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(data.statusCounts).map(([status, count]) => (
          <span
            key={status}
            className={cn("display border px-2.5 py-1 text-xs", STATUS_COLORS[status] ?? STATUS_COLORS.PENDING)}
          >
            {status}: {count}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="border border-paper/10">
          <h2 className="display border-b border-paper/10 px-4 py-3 text-xl">Recent Orders</h2>
          {data.recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-paper-dim">No orders yet.</p>
          ) : (
            data.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders?q=${o.orderNumber}`}
                className="flex items-center justify-between gap-2 border-b border-paper/5 px-4 py-2.5 text-sm last:border-0 hover:bg-ink-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="truncate text-xs text-paper-dim">
                    {o.email} · {o._count.items} item{o._count.items > 1 ? "s" : ""} · {o.paymentMethod}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold">{formatPrice(o.total)}</p>
                  <span className={cn("display border px-1.5 text-[10px]", STATUS_COLORS[o.status] ?? "")}>
                    {o.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </section>

        {/* Low stock */}
        <section className="border border-paper/10">
          <h2 className="display flex items-center gap-2 border-b border-paper/10 px-4 py-3 text-xl">
            <AlertTriangle size={17} className="text-blood" /> Low Stock
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-paper-dim">All healthy 🎉</p>
          ) : (
            data.lowStock.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between border-b border-paper/5 px-4 py-2.5 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.product.name}</p>
                  <p className="text-xs text-paper-dim">
                    {v.color} / {v.size} · {v.sku}
                  </p>
                </div>
                <span
                  className={cn(
                    "display shrink-0 px-2 py-0.5 text-sm",
                    v.stock === 0 ? "bg-blood text-white" : "bg-blood/10 text-blood",
                  )}
                >
                  {v.stock === 0 ? "OUT" : `${v.stock} left`}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
