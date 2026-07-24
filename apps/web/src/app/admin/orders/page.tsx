"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";

interface AdminOrder {
  id: string;
  orderNumber: string;
  email: string;
  phone: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  placedAt: string;
  courier?: string | null;
  trackingNumber?: string | null;
  addressSnapshot: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    id: string;
    productName: string;
    variantLabel: string;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  events?: { id: string; status: string; note: string | null; createdAt: string }[];
}

const STATUSES = ["ALL", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

/** Forward transitions offered per current status (mirrors the API rules). */
const NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "text-volt border-volt/40 bg-volt/10",
  PACKED: "text-volt border-volt/40 bg-volt/10",
  SHIPPED: "text-paper border-paper/30 bg-ink-3",
  DELIVERED: "text-paper border-paper/30 bg-ink-3",
  CANCELLED: "text-blood border-blood/40 bg-blood/10",
  PENDING: "text-paper-dim border-paper/20 bg-ink-3",
};

function OrdersInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (q.trim()) query.set("q", q.trim());
    if (status !== "ALL") query.set("status", status);
    const res = await authedFetch(`/admin/orders?${query}`);
    if (res.ok) {
      const data = (await res.json()) as { items: AdminOrder[] };
      setOrders(data.items);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance(orderNumber: string, next: string) {
    if (next === "CANCELLED" && !confirm(`Cancel ${orderNumber}? Stock will be restored.`)) return;

    // Shipping requires a tracking number so the customer can track the parcel.
    let ship: Record<string, string> = {};
    if (next === "SHIPPED") {
      const trackingNumber = prompt(`Tracking number (AWB) for ${orderNumber}:`)?.trim();
      if (!trackingNumber) return;
      const courier = prompt("Courier name (e.g. Delhivery, DTDC, Bluedart):")?.trim() ?? "";
      const trackingUrl = prompt("Tracking link (optional — paste the courier's track URL):")?.trim() ?? "";
      ship = { courier, trackingNumber, trackingUrl };
    }

    setActing(true);
    try {
      await authedFetch(`/admin/orders/${orderNumber}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, ...ship }),
      });
      await load();
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <h1 className="display text-3xl sm:text-4xl">
        Orders<span className="text-volt">.</span>
      </h1>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-paper/25 bg-ink-2 px-3">
          <Search size={15} className="text-paper-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order no, email, phone…"
            className="w-56 bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "display border px-2.5 py-1.5 text-xs transition-colors",
                status === s ? "border-paper bg-paper text-ink" : "border-paper/25 hover:border-paper",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {orders === null ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} className="animate-spin text-volt" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-20 text-center text-sm text-paper-dim">No orders match.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {orders.map((o) => {
            const open = openId === o.id;
            return (
              <div key={o.id} className="border border-paper/10">
                <button
                  onClick={() => setOpenId(open ? null : o.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <p className="truncate text-xs text-paper-dim">
                      {new Date(o.placedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                      {o.email}
                    </p>
                  </div>
                  <span className={cn("display border px-2 py-0.5 text-xs", STATUS_STYLE[o.status])}>
                    {o.status}
                  </span>
                  <span className="w-20 text-right text-sm font-bold">{formatPrice(o.total)}</span>
                  <ChevronDown size={16} className={cn("text-paper-dim transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="grid gap-4 border-t border-paper/10 p-4 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      {o.items.map((i) => (
                        <div key={i.id} className="mb-2 flex items-center gap-3 text-sm">
                          <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-ink-2">
                            {i.image && <Image src={i.image} alt="" fill sizes="40px" className="object-cover" />}
                          </div>
                          <p className="min-w-0 flex-1 truncate">
                            {i.productName} <span className="text-paper-dim">({i.variantLabel})</span> × {i.quantity}
                          </p>
                          <p className="font-semibold">{formatPrice(i.lineTotal)}</p>
                        </div>
                      ))}
                      <p className="mt-3 border-t border-paper/10 pt-2 text-xs text-paper-dim">
                        {o.paymentMethod} · payment {o.paymentStatus} · deliver to: {o.addressSnapshot.fullName},{" "}
                        {o.addressSnapshot.line1}, {o.addressSnapshot.city} — {o.addressSnapshot.pincode} ·{" "}
                        {o.addressSnapshot.phone}
                      </p>
                      {o.trackingNumber && (
                        <p className="mt-1 text-xs font-semibold text-volt">
                          Shipped · {o.courier || "courier"} · AWB {o.trackingNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="display mb-2 text-sm tracking-widest text-paper-dim">ACTIONS</p>
                      <div className="flex flex-wrap gap-2">
                        {(NEXT[o.status] ?? []).map((n) => (
                          <button
                            key={n}
                            disabled={acting}
                            onClick={() => void advance(o.orderNumber, n)}
                            className={cn(
                              "display px-4 py-2 text-sm transition-colors disabled:opacity-50",
                              n === "CANCELLED"
                                ? "border border-blood/50 text-blood hover:bg-blood hover:text-white"
                                : "bg-volt text-ink hover:-translate-y-0.5",
                            )}
                          >
                            Mark {n}
                          </button>
                        ))}
                        {(NEXT[o.status] ?? []).length === 0 && (
                          <p className="text-xs text-paper-dim">No further actions.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
