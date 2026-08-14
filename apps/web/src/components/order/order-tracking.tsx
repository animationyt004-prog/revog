"use client";

import { useState } from "react";
import { CalendarDays, Check, Copy, ExternalLink, Truck } from "lucide-react";
import type { OrderData } from "@/lib/types";
import { cn } from "@/lib/format";

const STEPS = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

function deliveryDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Order progress and customer-facing shipment details. */
export function OrderTracking({ order }: { order: OrderData }) {
  const [copied, setCopied] = useState(false);
  const cancelled = order.status === "CANCELLED";
  const returned = ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(
    order.status,
  );
  const currentIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const originalDate = deliveryDate(order.estimatedDeliveryAt);
  const revisedDate = deliveryDate(order.revisedDeliveryAt);

  async function copyTrackingNumber() {
    if (!order.trackingNumber) return;
    await navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-8 border border-paper/10">
      <h2 className="display flex items-center gap-2 border-b border-paper/10 px-4 py-3 text-xl">
        <Truck size={18} className="text-volt" /> Track Your Order
      </h2>

      <div className="p-5">
        {cancelled ? (
          <p className="text-sm font-semibold text-blood">
            This order was cancelled.
          </p>
        ) : returned ? (
          <p className="text-sm font-semibold text-paper">
            Return in progress - status:{" "}
            {order.status.replace(/_/g, " ").toLowerCase()}.
          </p>
        ) : (
          <ol className="flex items-center">
            {STEPS.map((step, index) => {
              const done = currentIndex >= 0 && index <= currentIndex;
              const active = index === currentIndex;
              return (
                <li
                  key={step}
                  className="flex flex-1 items-center last:flex-none"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border text-xs transition-colors",
                        done
                          ? "border-volt bg-volt text-white"
                          : "border-paper/25 bg-ink text-paper-dim",
                        active && "ring-2 ring-volt/30",
                      )}
                    >
                      {done ? <Check size={16} /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 text-[11px]",
                        done ? "font-semibold text-paper" : "text-paper-dim",
                      )}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "mx-1 -mt-5 h-0.5 flex-1",
                        currentIndex > index ? "bg-volt" : "bg-paper/15",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {order.trackingNumber && (
          <div className="mt-6 border-t border-paper/10 pt-5">
            {(revisedDate || originalDate) && (
              <div
                className={cn(
                  "mb-5 flex items-start gap-3 border-l-2 px-4 py-3",
                  revisedDate
                    ? "border-volt bg-volt/5"
                    : "border-paper/30 bg-ink-2",
                )}
              >
                <CalendarDays
                  size={19}
                  className={cn("mt-0.5 shrink-0", revisedDate && "text-volt")}
                />
                <div>
                  <p className="text-xs font-semibold uppercase text-paper-dim">
                    {revisedDate ? "Revised delivery" : "Expected delivery"}
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-paper">
                    {revisedDate || originalDate}
                  </p>
                  {revisedDate && originalDate && (
                    <p className="mt-1 text-xs text-paper-dim">
                      Original estimate: {originalDate}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="text-sm">
                <p className="text-paper-dim">
                  Courier:{" "}
                  <span className="font-semibold text-paper">
                    {order.courier || "Assigned"}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-paper-dim">
                  Tracking ID:{" "}
                  <span className="font-semibold text-paper">
                    {order.trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyTrackingNumber()}
                    title="Copy tracking ID"
                    aria-label="Copy tracking ID"
                    className="grid h-8 w-8 place-items-center border border-paper/20 text-paper-dim hover:border-paper hover:text-paper"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  {copied && (
                    <span
                      className="text-xs font-semibold text-volt"
                      role="status"
                    >
                      Copied
                    </span>
                  )}
                </div>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 bg-volt px-5 text-sm font-semibold text-white transition-colors hover:bg-volt/85"
                >
                  Track package <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
