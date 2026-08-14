"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { AddProductForm } from "@/components/admin/add-product-form";
import {
  AdminPageHeader,
  useAdminLiveRefresh,
} from "@/components/admin/live-refresh";
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
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authedFetch("/admin/products");
    if (!res.ok) throw new Error("Products could not be refreshed.");
    setProducts((await res.json()) as AdminProduct[]);
  }, []);
  const live = useAdminLiveRefresh(load, { intervalMs: 20_000 });

  async function patchProduct(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const response = await authedFetch(`/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Product update failed.");
      await live.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function setStock(variantId: string, stock: number) {
    setBusy(variantId);
    try {
      const response = await authedFetch(`/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      if (!response.ok) throw new Error("Stock update failed.");
      await live.refresh();
    } finally {
      setBusy(null);
    }
  }

  function openDelete(product: AdminProduct) {
    setDeleteTarget(product);
    setDeleteConfirmation("");
    setDeleteError(null);
  }

  function closeDelete() {
    if (busy?.startsWith("delete:")) return;
    setDeleteTarget(null);
    setDeleteConfirmation("");
    setDeleteError(null);
  }

  async function deleteProduct() {
    if (!deleteTarget || deleteConfirmation !== "DELETE") return;
    const busyKey = `delete:${deleteTarget.id}`;
    setBusy(busyKey);
    setDeleteError(null);
    try {
      const response = await authedFetch(`/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        const message = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message;
        throw new Error(message ?? "Product could not be deleted.");
      }
      setDeleteTarget(null);
      setDeleteConfirmation("");
      await live.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Product could not be deleted.",
      );
    } finally {
      setBusy(null);
    }
  }

  function promptPrice(p: AdminProduct) {
    const input = prompt(
      `New selling price for "${p.name}" (₹, currently ${p.price / 100}):`,
    );
    if (!input) return;
    const rupees = Number(input);
    if (!Number.isFinite(rupees) || rupees < 1)
      return alert("Enter a valid amount.");
    if (rupees * 100 > p.mrp)
      return alert(`Price can't exceed MRP (₹${p.mrp / 100}).`);
    void patchProduct(p.id, { price: Math.round(rupees * 100) });
  }

  if (products === null) {
    return (
      <div>
        <AdminPageHeader title="Products" live={live} />
        <div className="grid place-items-center py-24">
          {live.error ? (
            <p className="text-sm text-blood">{live.error}</p>
          ) : (
            <Loader2 size={26} className="animate-spin text-volt" />
          )}
        </div>
      </div>
    );
  }

  const zeroStockProducts = products.filter(
    (product) =>
      product.variants.reduce((sum, variant) => sum + variant.stock, 0) === 0,
  );

  return (
    <div>
      <AdminPageHeader
        title="Products"
        count={products.length}
        live={live}
        actions={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex h-9 items-center gap-1.5 bg-volt px-3 text-sm font-semibold text-ink"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />

      {showAdd && (
        <div className="mt-5">
          <AddProductForm
            onClose={() => setShowAdd(false)}
            onCreated={() => {
              setShowAdd(false);
              void live.refresh();
            }}
          />
        </div>
      )}

      <section className="mt-6 border border-blood/35 bg-blood/5">
        <div className="flex items-center justify-between gap-4 border-b border-blood/20 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Trash2 size={17} className="shrink-0 text-blood" />
            <h2 className="display truncate text-base sm:text-lg">
              Out of stock · Permanent removal
            </h2>
          </div>
          <span className="shrink-0 text-xs font-semibold text-blood">
            {zeroStockProducts.length}
          </span>
        </div>

        {zeroStockProducts.length === 0 ? (
          <p className="px-4 py-5 text-sm text-paper-dim">
            No zero-stock products.
          </p>
        ) : (
          <div className="divide-y divide-paper/10">
            {zeroStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-ink-2">
                  {product.images[0] && (
                    <Image
                      src={product.images[0].url}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>
                  <p className="text-xs text-paper-dim">
                    {product.category?.name} · {product.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openDelete(product)}
                  className="flex h-9 shrink-0 items-center gap-1.5 border border-blood/50 px-3 text-xs font-semibold text-blood transition-colors hover:bg-blood hover:text-white"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 space-y-2">
        {products.map((p) => {
          const open = openId === p.id;
          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <div
              key={p.id}
              className={cn(
                "border border-paper/10",
                busy === p.id && "opacity-60",
              )}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden bg-ink-2">
                  {p.images[0] && (
                    <Image
                      src={p.images[0].url}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
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
                  <span className="text-xs text-paper-dim line-through">
                    {formatPrice(p.mrp)}
                  </span>
                </button>

                {/* Badge flags */}
                <div className="hidden gap-1 lg:flex">
                  {FLAGS.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() =>
                        void patchProduct(p.id, { [key]: !p[key] })
                      }
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

                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  aria-label="Toggle variants"
                >
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-paper-dim transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {/* Variant stock editor */}
              {open && (
                <div className="grid grid-cols-2 gap-2 border-t border-paper/10 p-3 sm:grid-cols-3 lg:grid-cols-5">
                  {p.variants.map((v) => (
                    <div
                      key={v.id}
                      className={cn(
                        "border border-paper/15 p-2 text-xs",
                        busy === v.id && "opacity-50",
                      )}
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
                            if (
                              Number.isInteger(val) &&
                              val >= 0 &&
                              val !== v.stock
                            ) {
                              void setStock(v.id, val);
                            }
                          }}
                          className={cn(
                            "w-16 border bg-ink-2 px-1.5 py-1 outline-none focus:border-volt",
                            v.stock === 0
                              ? "border-blood/50 text-blood"
                              : "border-paper/25",
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
        Tip: click a price to change it · stock saves when you click away from
        the box · use &ldquo;Add Product&rdquo; for resell items (cost auto
        +₹200) · direct photo upload arrives with the image-storage phase — for
        now paste an image URL you have rights to.
      </p>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeDelete();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-heading"
            className="w-full max-w-md border border-blood/40 bg-ink p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={20} className="shrink-0 text-blood" />
                <h2 id="delete-product-heading" className="display text-xl">
                  Delete permanently?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDelete}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center text-paper-dim hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold">{deleteTarget.name}</p>
            <p className="mt-2 text-sm leading-6 text-paper-dim">
              Product page, variants, carts, wishlists and reviews will be
              deleted. Existing order history will remain intact.
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase text-paper-dim">
                Type DELETE to confirm
              </span>
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoFocus
                className="mt-2 h-10 w-full border border-paper/25 bg-ink-2 px-3 text-sm outline-none focus:border-blood"
              />
            </label>

            {deleteError && (
              <p className="mt-3 text-sm text-blood">{deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDelete}
                className="h-9 border border-paper/25 px-4 text-sm hover:border-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteProduct()}
                disabled={
                  deleteConfirmation !== "DELETE" ||
                  busy === `delete:${deleteTarget.id}`
                }
                className="flex h-9 items-center gap-1.5 bg-blood px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === `delete:${deleteTarget.id}` ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
