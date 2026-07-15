"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { AddProductForm } from "@/components/admin/add-product-form";
import { cn, formatPrice } from "@/lib/format";

interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isNewArrival: boolean;
  isTrending: boolean;
  isLimited: boolean;
  isBestSeller: boolean;
  category: { name: string } | null;
  images: { url: string }[];
  variants: AdminVariant[];
}

const FLAGS = [
  ["isNewArrival", "NEW"],
  ["isTrending", "TREND"],
  ["isLimited", "LTD"],
  ["isBestSeller", "BEST"],
] as const;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const res = await authedFetch("/admin/products");
    if (res.ok) setProducts((await res.json()) as AdminProduct[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchProduct(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await authedFetch(`/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function setStock(variantId: string, stock: number) {
    setBusy(variantId);
    try {
      await authedFetch(`/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  function promptPrice(p: AdminProduct) {
    const input = prompt(`New selling price for "${p.name}" (₹, currently ${p.price / 100}):`);
    if (!input) return;
    const rupees = Number(input);
    if (!Number.isFinite(rupees) || rupees < 1) return alert("Enter a valid amount.");
    if (rupees * 100 > p.mrp) return alert(`Price can't exceed MRP (₹${p.mrp / 100}).`);
    void patchProduct(p.id, { price: Math.round(rupees * 100) });
  }

  if (products === null) {
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
          Products<span className="text-volt">.</span>{" "}
          <span className="text-base text-paper-dim">({products.length})</span>
        </h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="display flex items-center gap-1.5 bg-volt px-4 py-2.5 text-base text-ink"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="mt-5">
          <AddProductForm
            onClose={() => setShowAdd(false)}
            onCreated={() => { setShowAdd(false); void load(); }}
          />
        </div>
      )}

      <div className="mt-6 space-y-2">
        {products.map((p) => {
          const open = openId === p.id;
          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <div key={p.id} className={cn("border border-paper/10", busy === p.id && "opacity-60")}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-ink-2">
                  {p.images[0] && (
                    <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-paper-dim">
                    {p.category?.name} · stock {totalStock}
                  </p>
                </div>

                {/* Price (click to edit) */}
                <button
                  onClick={() => promptPrice(p)}
                  title="Edit price"
                  className="hidden text-right text-sm hover:text-volt sm:block"
                >
                  <span className="font-bold">{formatPrice(p.price)}</span>{" "}
                  <span className="text-xs text-paper-dim line-through">{formatPrice(p.mrp)}</span>
                </button>

                {/* Badge flags */}
                <div className="hidden gap-1 lg:flex">
                  {FLAGS.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => void patchProduct(p.id, { [key]: !p[key] })}
                      className={cn(
                        "display border px-1.5 py-0.5 text-[10px] transition-colors",
                        p[key]
                          ? "border-volt bg-volt/15 text-volt"
                          : "border-paper/20 text-paper-dim hover:border-paper",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Publish toggle */}
                <button
                  onClick={() =>
                    void patchProduct(p.id, {
                      status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                    })
                  }
                  className={cn(
                    "display border px-2.5 py-1 text-xs transition-colors",
                    p.status === "PUBLISHED"
                      ? "border-volt/40 bg-volt/10 text-volt"
                      : "border-paper/25 text-paper-dim",
                  )}
                >
                  {p.status}
                </button>

                <button onClick={() => setOpenId(open ? null : p.id)} aria-label="Toggle variants">
                  <ChevronDown
                    size={16}
                    className={cn("text-paper-dim transition-transform", open && "rotate-180")}
                  />
                </button>
              </div>

              {/* Variant stock editor */}
              {open && (
                <div className="grid grid-cols-2 gap-2 border-t border-paper/10 p-3 sm:grid-cols-3 lg:grid-cols-5">
                  {p.variants.map((v) => (
                    <div
                      key={v.id}
                      className={cn("border border-paper/15 p-2 text-xs", busy === v.id && "opacity-50")}
                    >
                      <p className="font-semibold">
                        {v.color} / {v.size}
                      </p>
                      <p className="text-[10px] text-paper-dim">{v.sku}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          defaultValue={v.stock}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (Number.isInteger(val) && val >= 0 && val !== v.stock) {
                              void setStock(v.id, val);
                            }
                          }}
                          className={cn(
                            "w-16 border bg-ink-2 px-1.5 py-1 outline-none focus:border-volt",
                            v.stock === 0 ? "border-blood/50 text-blood" : "border-paper/25",
                          )}
                        />
                        <span className="text-paper-dim">pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-paper-dim">
        Tip: click a price to change it · stock saves when you click away from the box · use
        &ldquo;Add Product&rdquo; for resell items (cost auto +₹200) · direct photo upload arrives
        with the image-storage phase — for now paste an image URL you have rights to.
      </p>
    </div>
  );
}
