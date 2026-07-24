import { Check, ExternalLink, Truck } from "lucide-react";
import type { OrderData } from "@/lib/types";
import { cn } from "@/lib/format";

const STEPS = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

/** Order progress stepper + courier tracking details. */
export function OrderTracking({ order }: { order: OrderData }) {
  const cancelled = order.status === "CANCELLED";
  const returned = ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(order.status);

  // PENDING maps before "Confirmed"; anything else maps onto the 4-step line.
  const currentIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <section className="mt-8 border border-paper/10">
      <h2 className="display flex items-center gap-2 border-b border-paper/10 px-4 py-3 text-xl">
        <Truck size={18} className="text-volt" /> Track Your Order
      </h2>

      <div className="p-5">
        {cancelled ? (
          <p className="text-sm font-semibold text-blood">This order was cancelled.</p>
        ) : returned ? (
          <p className="text-sm font-semibold text-paper">
            Return in progress — status: {order.status.replace(/_/g, " ").toLowerCase()}.
          </p>
        ) : (
          <ol className="flex items-center">
            {STEPS.map((step, i) => {
              const done = currentIndex >= 0 && i <= currentIndex;
              const active = i === currentIndex;
              return (
                <li key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border text-xs transition-colors",
                        done
                          ? "border-volt bg-volt text-ink"
                          : "border-paper/25 bg-ink text-paper-dim",
                        active && "ring-2 ring-volt/30",
                      )}
                    >
                      {done ? <Check size={16} /> : i + 1}
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
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "mx-1 -mt-5 h-0.5 flex-1",
                        currentIndex > i ? "bg-volt" : "bg-paper/15",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {/* Courier + AWB, shown once shipped. */}
        {order.trackingNumber && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-4">
            <div className="text-sm">
              <p className="text-paper-dim">
                Courier: <span className="font-semibold text-paper">{order.courier || "Assigned"}</span>
              </p>
              <p className="text-paper-dim">
                Tracking ID: <span className="font-semibold text-paper">{order.trackingNumber}</span>
              </p>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="display inline-flex items-center gap-1.5 rounded-sm bg-volt px-5 py-2.5 text-sm text-ink transition-transform hover:-translate-y-0.5"
              >
                Track Package <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
