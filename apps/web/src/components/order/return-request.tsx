"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/format";

/** Shown on a DELIVERED order page. Requires login (the order is claimed by
 *  email automatically at first login, so guests just log in and it works). */
export function ReturnRequest({
  orderNumber,
  orderEmail,
  orderStatus,
}: {
  orderNumber: string;
  orderEmail: string;
  orderStatus: string;
}) {
  const { status, user } = useAuth();
  const [reasons, setReasons] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owns = status === "authed" && user?.email === orderEmail;

  useEffect(() => {
    if (!open || reasons.length > 0) return;
    authedFetch("/returns/reasons")
      .then((r) => (r.ok ? r.json() : []))
      .then(setReasons)
      .catch(() => undefined);
  }, [open, reasons.length]);

  if (orderStatus === "RETURN_REQUESTED") {
    return (
      <p className="mt-6 border border-volt/40 bg-volt/10 p-4 text-sm">
        Return requested — we&apos;ll email you pickup details shortly.
      </p>
    );
  }
  if (orderStatus !== "DELIVERED") return null;

  if (!owns) {
    return (
      <p className="mt-6 text-center text-xs text-paper-dim">
        Need to return something? Log in with {orderEmail.replace(/^(.{3}).*(@.*)$/, "$1***$2")} to
        start a return.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-6 border border-volt/40 bg-volt/10 p-4 text-sm font-semibold text-volt">
        ✓ Return requested. We&apos;ll email pickup details within 24 hours.
      </p>
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch("/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, reason }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(data.message) ? data.message[0] : (data.message ?? "Could not request return."),
        );
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request return.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border border-paper/10 p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:text-volt"
        >
          <RotateCcw size={15} /> Return or exchange this order
        </button>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <p className="display mb-2 text-lg">Why is it coming back?</p>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  "border px-3 py-1.5 text-xs transition-colors",
                  reason === r
                    ? "border-paper bg-paper text-ink"
                    : "border-paper/25 hover:border-paper",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!reason || busy}
            className={cn(
              "display mt-4 px-6 py-2.5 text-base",
              reason && !busy ? "bg-volt text-ink" : "cursor-not-allowed bg-ink-3 text-paper-dim",
            )}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Request Return"}
          </button>
          {error && <p className="mt-2 text-xs text-blood">{error}</p>}
          <p className="mt-2 text-[11px] text-paper-dim">
            7-day window from delivery · refund to original payment method (COD refunds via UPI).
          </p>
        </form>
      )}
    </div>
  );
}
