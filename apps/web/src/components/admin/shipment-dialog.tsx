"use client";

import { useState } from "react";
import { CalendarDays, Loader2, PackageCheck, Truck, X } from "lucide-react";
import { cn } from "@/lib/format";

export interface ShipmentPayload {
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDeliveryAt: string;
  revisedDeliveryAt?: string | null;
  note?: string;
}

interface ShipmentOrder {
  orderNumber: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
  revisedDeliveryAt?: string | null;
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function apiDate(value: string) {
  return `${value}T12:00:00.000Z`;
}

const fieldClass =
  "w-full border border-paper/20 bg-white px-3 text-sm text-paper caret-volt outline-none placeholder:text-paper-dim/65 focus:border-volt";

export function ShipmentDialog({
  order,
  mode,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  order: ShipmentOrder;
  mode: "ship" | "update" | "reopen";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: ShipmentPayload) => Promise<void>;
}) {
  const [courier, setCourier] = useState(order.courier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? "",
  );
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [estimatedDate, setEstimatedDate] = useState(
    dateInputValue(order.estimatedDeliveryAt),
  );
  const [revisedDate, setRevisedDate] = useState(
    dateInputValue(order.revisedDeliveryAt),
  );
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const updating = mode === "update";
  const reopening = mode === "reopen";

  async function submit() {
    setLocalError(null);
    if (courier.trim().length < 2) {
      setLocalError("Enter the courier partner.");
      return;
    }
    if (trackingNumber.trim().length < 2) {
      setLocalError("Enter the tracking ID or AWB.");
      return;
    }
    if (!estimatedDate) {
      setLocalError("Select the expected delivery date.");
      return;
    }
    if (trackingUrl && !/^https:\/\/\S+$/i.test(trackingUrl)) {
      setLocalError("Tracking link must start with https://");
      return;
    }
    if (revisedDate && revisedDate < estimatedDate) {
      setLocalError(
        "Revised delivery cannot be earlier than the original estimate.",
      );
      return;
    }
    if (reopening && note.trim().length < 3) {
      setLocalError("Explain why the delivered order is being reopened.");
      return;
    }

    await onSubmit({
      courier: courier.trim(),
      trackingNumber: trackingNumber.trim(),
      ...(trackingUrl.trim() ? { trackingUrl: trackingUrl.trim() } : {}),
      estimatedDeliveryAt: apiDate(estimatedDate),
      revisedDeliveryAt: revisedDate ? apiDate(revisedDate) : null,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-night/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipment-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl border border-paper/15 bg-ink shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-paper/10 px-5 py-5 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-volt">
              {updating ? <CalendarDays size={14} /> : <Truck size={14} />}
              {order.orderNumber}
            </p>
            <h2 id="shipment-dialog-title" className="display mt-2 text-3xl">
              {updating
                ? "Update shipment"
                : reopening
                  ? "Reopen shipment"
                  : "Mark as shipped"}
            </h2>
            <p className="mt-2 text-sm text-paper-dim">
              {updating
                ? "Revise tracking or delivery details without changing the order status."
                : "These details will be visible on the customer order page."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close shipment dialog"
            title="Close"
            className="grid h-10 w-10 shrink-0 place-items-center border border-paper/15 text-paper-dim hover:border-paper/40 hover:text-paper disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              Courier partner
            </span>
            <input
              value={courier}
              maxLength={60}
              onChange={(event) => setCourier(event.target.value)}
              placeholder="Delhivery, DTDC, Blue Dart"
              className={cn(fieldClass, "h-12")}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              Tracking ID / AWB
            </span>
            <input
              value={trackingNumber}
              maxLength={80}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="Enter courier tracking number"
              className={cn(fieldClass, "h-12")}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              Tracking link
            </span>
            <input
              type="url"
              value={trackingUrl}
              maxLength={300}
              onChange={(event) => setTrackingUrl(event.target.value)}
              placeholder="https://courier.example/track/..."
              className={cn(fieldClass, "h-12")}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              Expected delivery
            </span>
            <input
              type="date"
              value={estimatedDate}
              onChange={(event) => setEstimatedDate(event.target.value)}
              className={cn(fieldClass, "h-12")}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              Revised delivery
            </span>
            <input
              type="date"
              value={revisedDate}
              min={estimatedDate || undefined}
              onChange={(event) => setRevisedDate(event.target.value)}
              className={cn(fieldClass, "h-12")}
            />
            <span className="mt-1 block text-[11px] text-paper-dim">
              Leave blank until the original delivery estimate changes.
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
              {reopening ? "Correction reason" : "Update note (optional)"}
            </span>
            <textarea
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                reopening
                  ? "Why is this delivered order being reopened?"
                  : "Reason for revised delivery or tracking change"
              }
              className={cn(fieldClass, "min-h-24 resize-y py-3")}
            />
          </label>

          {(localError || error) && (
            <p className="sm:col-span-2 text-sm text-blood" role="alert">
              {localError || error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-paper/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 border border-paper/20 px-5 text-sm font-semibold text-paper-dim hover:border-paper/50 hover:text-paper disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className={cn(
              "flex h-11 items-center gap-2 bg-volt px-5 text-sm font-semibold text-white disabled:opacity-50",
            )}
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <PackageCheck size={17} />
            )}
            {updating
              ? "Save shipment"
              : reopening
                ? "Reopen as shipped"
                : "Mark shipped"}
          </button>
        </div>
      </div>
    </div>
  );
}
