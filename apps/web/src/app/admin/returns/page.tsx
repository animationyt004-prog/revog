"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { AdminPageHeader, useAdminLiveRefresh } from "@/components/admin/live-refresh";
import { cn, formatPrice } from "@/lib/format";

interface AdminReturn {
  id: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";
  refundAmount: number | null;
  createdAt: string;
  order: { orderNumber: string; email: string; total: number; paymentMethod: string };
  orderItem: { productName: string; variantLabel: string } | null;
  user: { email: string };
}

/** Mirrors the API's allowed transitions. */
const NEXT: Record<string, string[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED"],
};

const STYLE: Record<string, string> = {
  REQUESTED: "border-volt/40 bg-volt/10 text-volt",
  APPROVED: "border-volt/40 bg-volt/10 text-volt",
  RECEIVED: "border-paper/30 bg-ink-3 text-paper",
  REFUNDED: "border-paper/30 bg-ink-3 text-paper",
  REJECTED: "border-blood/40 bg-blood/10 text-blood",
};

export default function AdminReturnsPage() {
  const [items, setItems] = useState<AdminReturn[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authedFetch("/admin/returns");
    if (!res.ok) throw new Error("Returns could not be refreshed.");
    setItems((await res.json()) as AdminReturn[]);
  }, []);
  const live = useAdminLiveRefresh(load);

  async function resolve(id: string, status: string) {
    setBusy(true);
    setActionError(null);
    try {
      const response = await authedFetch(`/admin/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Return status could not be updated.");
      await live.refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Return update failed.");
    } finally {
      setBusy(false);
    }
  }

  if (items === null) {
    return (
      <div>
        <AdminPageHeader title="Returns" live={live} />
        <div className="grid place-items-center py-24">
          {live.error ? <p className="text-sm text-blood">{live.error}</p> : <Loader2 size={26} className="animate-spin text-volt" />}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Returns" count={items.length} live={live} />
      {actionError && <p className="mt-3 border-l-2 border-blood bg-blood/5 px-3 py-2 text-sm text-blood" role="alert">{actionError}</p>}

      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-paper-dim">No return requests. 🎉</p>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((r) => (
            <div key={r.id} className="border border-paper/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{r.order.orderNumber}</p>
                <span className={cn("display border px-2 py-0.5 text-xs", STYLE[r.status])}>
                  {r.status}
                </span>
                <span className="ml-auto text-sm font-bold">
                  refund {formatPrice(r.refundAmount ?? r.order.total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-paper-dim">
                {r.user.email} · {r.orderItem ? `${r.orderItem.productName} (${r.orderItem.variantLabel})` : "entire order"} ·{" "}
                {r.order.paymentMethod} ·{" "}
                {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              <p className="mt-2 text-sm">
                Reason: <strong>{r.reason}</strong>
              </p>
              {(NEXT[r.status] ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {NEXT[r.status].map((n) => (
                    <button
                      key={n}
                      disabled={busy}
                      onClick={() => void resolve(r.id, n)}
                      className={cn(
                        "display px-4 py-2 text-sm transition-colors disabled:opacity-50",
                        n === "REJECTED"
                          ? "border border-blood/50 text-blood hover:bg-blood hover:text-white"
                          : "bg-volt text-ink hover:-translate-y-0.5",
                      )}
                    >
                      {n === "RECEIVED" ? "Mark RECEIVED (restocks)" : n === "REFUNDED" ? "Mark REFUNDED" : n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
