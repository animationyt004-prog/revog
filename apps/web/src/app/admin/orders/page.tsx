"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  History,
  Loader2,
  Pencil,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  AdminPageHeader,
  useAdminLiveRefresh,
} from "@/components/admin/live-refresh";
import {
  ShipmentDialog,
  type ShipmentPayload,
} from "@/components/admin/shipment-dialog";
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
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
  revisedDeliveryAt?: string | null;
  shipmentUpdatedAt?: string | null;
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
  events?: {
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }[];
}

type ShipmentAction = {
  order: AdminOrder;
  mode: "ship" | "update" | "reopen";
};

const STATUSES = [
  "ALL",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["SHIPPED", "CANCELLED"],
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "text-volt border-volt/40 bg-volt/10",
  PACKED: "text-volt border-volt/40 bg-volt/10",
  SHIPPED: "text-paper border-paper/30 bg-ink-3",
  DELIVERED: "text-paper border-paper/30 bg-ink-3",
  CANCELLED: "text-blood border-blood/40 bg-blood/10",
  PENDING: "text-paper-dim border-paper/20 bg-ink-3",
};

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  });
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  return Array.isArray(body.message)
    ? body.message[0]
    : body.message || fallback;
}

function OrdersInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shipmentAction, setShipmentAction] = useState<ShipmentAction | null>(
    null,
  );
  const [cancelOrder, setCancelOrder] = useState<AdminOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (q.trim()) query.set("q", q.trim());
    if (status !== "ALL") query.set("status", status);
    const res = await authedFetch(`/admin/orders?${query}`);
    if (!res.ok) throw new Error("Orders could not be refreshed.");
    const data = (await res.json()) as { items: AdminOrder[] };
    setOrders(data.items);
  }, [q, status]);
  const live = useAdminLiveRefresh(load);

  async function changeStatus(
    orderNumber: string,
    next: string,
    extra: object = {},
  ) {
    const response = await authedFetch(`/admin/orders/${orderNumber}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, ...extra }),
    });
    if (!response.ok) {
      throw new Error(await responseError(response, "Order update failed."));
    }
  }

  function beginStatusAction(order: AdminOrder, next: string) {
    setActionError(null);
    if (next === "SHIPPED") {
      setShipmentAction({
        order,
        mode: order.status === "DELIVERED" ? "reopen" : "ship",
      });
      return;
    }
    if (next === "CANCELLED") {
      setCancelOrder(order);
      setCancelReason("");
      return;
    }

    setActing(true);
    void changeStatus(order.orderNumber, next)
      .then(() => live.refresh())
      .catch((cause: unknown) => {
        setActionError(
          cause instanceof Error ? cause.message : "Order update failed.",
        );
      })
      .finally(() => setActing(false));
  }

  async function submitShipment(payload: ShipmentPayload) {
    if (!shipmentAction) return;
    setActing(true);
    setActionError(null);
    try {
      if (shipmentAction.mode === "update") {
        const response = await authedFetch(
          `/admin/orders/${shipmentAction.order.orderNumber}/shipment`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          throw new Error(
            await responseError(response, "Shipment update failed."),
          );
        }
      } else {
        await changeStatus(
          shipmentAction.order.orderNumber,
          "SHIPPED",
          payload,
        );
      }
      await live.refresh();
      setShipmentAction(null);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Shipment update failed.",
      );
    } finally {
      setActing(false);
    }
  }

  async function confirmCancellation() {
    if (!cancelOrder) return;
    if (cancelReason.trim().length < 3) {
      setActionError("Enter a cancellation reason.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      await changeStatus(cancelOrder.orderNumber, "CANCELLED", {
        note: cancelReason.trim(),
      });
      await live.refresh();
      setCancelOrder(null);
      setCancelReason("");
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Order cancellation failed.",
      );
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Orders" count={orders?.length} live={live} />
      {actionError && !shipmentAction && !cancelOrder && (
        <p
          className="mt-3 border-l-2 border-blood bg-blood/5 px-3 py-2 text-sm text-blood"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-paper/25 bg-ink-2 px-3">
          <Search size={15} className="text-paper-dim" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Order number, email, phone"
            className="w-56 bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cn(
                "display border px-2.5 py-1.5 text-xs transition-colors",
                status === item
                  ? "border-paper bg-paper text-ink"
                  : "border-paper/25 hover:border-paper",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {orders === null ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} className="animate-spin text-volt" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-20 text-center text-sm text-paper-dim">
          No orders match.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {orders.map((order) => {
            const open = openId === order.id;
            const hasShipment = Boolean(order.trackingNumber);
            return (
              <div key={order.id} className="border border-paper/10">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : order.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{order.orderNumber}</p>
                    <p className="truncate text-xs text-paper-dim">
                      {formatDate(order.placedAt, true)} · {order.email}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "display border px-2 py-0.5 text-xs",
                      STATUS_STYLE[order.status],
                    )}
                  >
                    {order.status}
                  </span>
                  <span className="w-20 text-right text-sm font-bold">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-paper-dim transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open && (
                  <div className="grid gap-6 border-t border-paper/10 p-4 xl:grid-cols-[1.25fr_1fr]">
                    <div>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="mb-2 flex items-center gap-3 text-sm"
                        >
                          <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-ink-2">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <p className="min-w-0 flex-1 truncate">
                            {item.productName}{" "}
                            <span className="text-paper-dim">
                              ({item.variantLabel})
                            </span>{" "}
                            x {item.quantity}
                          </p>
                          <p className="font-semibold">
                            {formatPrice(item.lineTotal)}
                          </p>
                        </div>
                      ))}
                      <p className="mt-3 border-t border-paper/10 pt-3 text-xs leading-5 text-paper-dim">
                        {order.paymentMethod} · payment {order.paymentStatus} ·
                        deliver to: {order.addressSnapshot.fullName},{" "}
                        {order.addressSnapshot.line1},{" "}
                        {order.addressSnapshot.city} -{" "}
                        {order.addressSnapshot.pincode} ·{" "}
                        {order.addressSnapshot.phone}
                      </p>

                      {hasShipment && (
                        <div className="mt-4 border-l-2 border-volt bg-ink-2 px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="flex items-center gap-2 text-sm font-semibold">
                                <Truck size={16} className="text-volt" />
                                {order.courier || "Courier assigned"}
                              </p>
                              <p className="mt-1 text-xs text-paper-dim">
                                AWB {order.trackingNumber}
                              </p>
                            </div>
                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center gap-1.5 border border-paper/20 px-3 text-xs font-semibold hover:border-paper"
                              >
                                Track <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                            <p className="flex items-center gap-2 text-paper-dim">
                              <CalendarDays size={14} /> Original:{" "}
                              {formatDate(order.estimatedDeliveryAt)}
                            </p>
                            <p
                              className={
                                order.revisedDeliveryAt
                                  ? "font-semibold text-volt"
                                  : "text-paper-dim"
                              }
                            >
                              Revised: {formatDate(order.revisedDeliveryAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="display mb-2 text-sm tracking-widest text-paper-dim">
                          ACTIONS
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {hasShipment &&
                            ["SHIPPED", "DELIVERED"].includes(order.status) && (
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => {
                                  setActionError(null);
                                  setShipmentAction({ order, mode: "update" });
                                }}
                                className="inline-flex h-10 items-center gap-2 border border-paper/25 px-3 text-sm font-semibold hover:border-paper disabled:opacity-50"
                              >
                                <Pencil size={15} /> Update shipment
                              </button>
                            )}
                          {(NEXT[order.status] ?? []).map((next) => (
                            <button
                              key={next}
                              type="button"
                              disabled={acting}
                              onClick={() => beginStatusAction(order, next)}
                              className={cn(
                                "h-10 px-4 text-sm font-semibold transition-colors disabled:opacity-50",
                                next === "CANCELLED"
                                  ? "border border-blood/50 text-blood hover:bg-blood hover:text-white"
                                  : "bg-volt text-white hover:bg-volt/85",
                              )}
                            >
                              {next === "SHIPPED" &&
                              order.status === "DELIVERED"
                                ? "Reopen as shipped"
                                : `Mark ${next.toLowerCase()}`}
                            </button>
                          ))}
                          {(NEXT[order.status] ?? []).length === 0 &&
                            !hasShipment && (
                              <p className="text-xs text-paper-dim">
                                No further actions.
                              </p>
                            )}
                        </div>
                      </div>

                      {order.events && order.events.length > 0 && (
                        <div>
                          <p className="display mb-2 flex items-center gap-2 text-sm tracking-widest text-paper-dim">
                            <History size={15} /> TIMELINE
                          </p>
                          <ol className="space-y-3 border-l border-paper/15 pl-4">
                            {order.events.slice(0, 8).map((event) => (
                              <li key={event.id} className="relative text-xs">
                                <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-volt" />
                                <p className="font-semibold text-paper">
                                  {event.status.replace(/_/g, " ")}
                                </p>
                                {event.note && (
                                  <p className="mt-0.5 leading-5 text-paper-dim">
                                    {event.note}
                                  </p>
                                )}
                                <p className="mt-0.5 text-[11px] text-paper-dim">
                                  {formatDate(event.createdAt, true)}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {shipmentAction && (
        <ShipmentDialog
          order={shipmentAction.order}
          mode={shipmentAction.mode}
          busy={acting}
          error={actionError}
          onClose={() => {
            if (!acting) {
              setShipmentAction(null);
              setActionError(null);
            }
          }}
          onSubmit={submitShipment}
        />
      )}

      {cancelOrder && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-night/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !acting) {
              setCancelOrder(null);
              setActionError(null);
            }
          }}
        >
          <div className="w-full max-w-lg border border-paper/15 bg-ink shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-paper/10 p-5">
              <div>
                <p className="text-xs font-semibold uppercase text-blood">
                  {cancelOrder.orderNumber}
                </p>
                <h2 id="cancel-order-title" className="display mt-2 text-3xl">
                  Cancel order
                </h2>
              </div>
              <button
                type="button"
                disabled={acting}
                onClick={() => {
                  setCancelOrder(null);
                  setActionError(null);
                }}
                aria-label="Close cancellation dialog"
                title="Close"
                className="grid h-10 w-10 place-items-center border border-paper/15 text-paper-dim hover:border-paper/40 hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {cancelOrder.status === "DELIVERED" && (
                <p className="mb-4 flex gap-2 border-l-2 border-blood bg-blood/5 px-3 py-3 text-sm text-paper-dim">
                  <AlertTriangle size={18} className="shrink-0 text-blood" />
                  Delivered stock will not be restored automatically. Review the
                  physical return and refund separately.
                </p>
              )}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
                  Cancellation reason
                </span>
                <textarea
                  value={cancelReason}
                  maxLength={300}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Reason visible in the order timeline"
                  className="min-h-24 w-full resize-y border border-paper/20 bg-white px-3 py-3 text-sm text-paper caret-volt outline-none placeholder:text-paper-dim/65 focus:border-volt"
                />
              </label>
              {actionError && (
                <p className="mt-3 text-sm text-blood" role="alert">
                  {actionError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-paper/10 p-4">
              <button
                type="button"
                disabled={acting}
                onClick={() => {
                  setCancelOrder(null);
                  setActionError(null);
                }}
                className="h-11 border border-paper/20 px-5 text-sm font-semibold text-paper-dim hover:border-paper"
              >
                Keep order
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void confirmCancellation()}
                className="inline-flex h-11 items-center gap-2 bg-blood px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {acting && <Loader2 size={16} className="animate-spin" />}
                Confirm cancellation
              </button>
            </div>
          </div>
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
