"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/format";
import type { PincodeResult } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export function PincodeChecker() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PincodeResult | null>(null);

  async function check() {
    if (!/^\d{6}$/.test(code)) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/pincode/${code}`);
      setResult(res.ok ? ((await res.json()) as PincodeResult) : null);
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border border-paper/10 p-4">
      <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold">
        <MapPin size={15} className="text-volt" /> Check Delivery
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); void check(); }}
      >
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setResult(null); }}
          placeholder="Enter 6-digit pincode"
          aria-label="Pincode"
          className="w-full border border-paper/25 bg-ink-2 px-3 py-2.5 text-sm outline-none focus:border-volt"
        />
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className={cn(
            "display px-5 text-base transition-colors",
            code.length === 6 && !busy
              ? "bg-paper text-ink hover:bg-volt"
              : "cursor-not-allowed bg-ink-3 text-paper-dim",
          )}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Check"}
        </button>
      </form>

      {result && (
        <div className="mt-3 text-sm" aria-live="polite">
          {result.serviceable ? (
            <>
              <p className="font-semibold text-volt">
                Delivers to {result.city}, {result.state}
              </p>
              <p className="mt-0.5 text-xs text-paper-dim">
                Arrives in {result.etaMinDays}–{result.etaMaxDays} days ·{" "}
                {result.codAvailable
                  ? "Cash on Delivery available"
                  : "Prepaid only (no COD here)"}
              </p>
            </>
          ) : (
            <p className="font-semibold text-blood">
              We don&apos;t deliver to {result.pincode} yet — expanding soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
