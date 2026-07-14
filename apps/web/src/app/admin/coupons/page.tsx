"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FLAT";
  value: number;
  minCartValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "PERCENT" as "PERCENT" | "FLAT",
    value: "",
    minCart: "",
    maxDiscount: "",
    usageLimit: "",
  });

  const load = useCallback(async () => {
    const res = await authedFetch("/admin/coupons");
    if (res.ok) setCoupons((await res.json()) as Coupon[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        code: form.code,
        description: form.description || undefined,
        type: form.type,
        // PERCENT: whole % · FLAT: rupees -> paise
        value: form.type === "PERCENT" ? Number(form.value) : Math.round(Number(form.value) * 100),
        minCartValue: form.minCart ? Math.round(Number(form.minCart) * 100) : undefined,
        maxDiscount: form.maxDiscount ? Math.round(Number(form.maxDiscount) * 100) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      };
      const res = await authedFetch("/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(Array.isArray(data.message) ? data.message[0] : (data.message ?? "Failed"));
      }
      setShowForm(false);
      setForm({ code: "", description: "", type: "PERCENT", value: "", minCart: "", maxDiscount: "", usageLimit: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string) {
    await authedFetch(`/admin/coupons/${id}/toggle`, { method: "PATCH" });
    await load();
  }

  if (coupons === null) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-volt" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl sm:text-4xl">
          Coupons<span className="text-volt">.</span>
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="display flex items-center gap-1.5 bg-volt px-4 py-2.5 text-base text-ink"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); void create(); }}
          className="mt-5 grid gap-3 border border-paper/10 bg-ink-2 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-paper-dim">CODE *</span>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="DIWALI20"
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 uppercase outline-none focus:border-volt"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-paper-dim">TYPE</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FLAT" })}
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
            >
              <option value="PERCENT">Percent off</option>
              <option value="FLAT">Flat ₹ off</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-paper-dim">
              {form.type === "PERCENT" ? "PERCENT (1-90) *" : "AMOUNT ₹ *"}
            </span>
            <input
              required
              inputMode="numeric"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })}
              placeholder={form.type === "PERCENT" ? "10" : "200"}
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-paper-dim">MIN CART ₹</span>
            <input
              inputMode="numeric"
              value={form.minCart}
              onChange={(e) => setForm({ ...form, minCart: e.target.value.replace(/\D/g, "") })}
              placeholder="999"
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
            />
          </label>
          {form.type === "PERCENT" && (
            <label className="text-xs">
              <span className="mb-1 block font-semibold text-paper-dim">MAX DISCOUNT ₹</span>
              <input
                inputMode="numeric"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value.replace(/\D/g, "") })}
                placeholder="500"
                className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
              />
            </label>
          )}
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-paper-dim">TOTAL USES</span>
            <input
              inputMode="numeric"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value.replace(/\D/g, "") })}
              placeholder="unlimited"
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="mb-1 block font-semibold text-paper-dim">DESCRIPTION</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Festive offer"
              className="w-full border border-paper/25 bg-ink px-2.5 py-2 outline-none focus:border-volt"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={busy}
              className="display bg-volt px-6 py-2.5 text-base text-ink disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Create"}
            </button>
            {error && <p className="text-xs text-blood">{error}</p>}
          </div>
        </form>
      )}

      {/* List */}
      <div className="mt-6 space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 border border-paper/10 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="display text-lg">{c.code}</p>
              <p className="text-xs text-paper-dim">
                {c.type === "PERCENT"
                  ? `${c.value}% off${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ""}`
                  : `${formatPrice(c.value)} off`}
                {c.minCartValue > 0 && ` · min cart ${formatPrice(c.minCartValue)}`}
                {" · "}used {c.usedCount}
                {c.usageLimit != null && `/${c.usageLimit}`}
              </p>
            </div>
            <button
              onClick={() => void toggle(c.id)}
              className={cn(
                "display border px-3 py-1 text-xs transition-colors",
                c.isActive
                  ? "border-volt/40 bg-volt/10 text-volt"
                  : "border-paper/25 text-paper-dim",
              )}
            >
              {c.isActive ? "ACTIVE" : "PAUSED"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
