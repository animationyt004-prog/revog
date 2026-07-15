"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn } from "@/lib/format";
import type { CategoryData } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Default resell markup in rupees (maxzone cost + this = selling price). */
const MARKUP = 200;

const FITS = ["OVERSIZED", "REGULAR", "RELAXED", "SLIM", "BAGGY"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const BADGES = ["NEW", "TRENDING", "LIMITED", "BESTSELLER", "SALE"];

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

export function AddProductForm({ onCreated, onClose }: Props) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [mrp, setMrp] = useState("");
  const [fit, setFit] = useState("OVERSIZED");
  const [fabric, setFabric] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [colors, setColors] = useState([{ name: "Jet Black", hex: "#111111" }]);
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL"]);
  const [stock, setStock] = useState("10");
  const [badges, setBadges] = useState<string[]>([]);
  const [publish, setPublish] = useState(true);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CategoryData[]) => {
        setCategories(data);
        if (data[0]) setCategorySlug(data[0].slug);
      })
      .catch(() => undefined);
  }, []);

  // Selling price auto-follows cost + markup until the user edits it manually.
  useEffect(() => {
    if (!priceTouched) {
      const c = Number(cost);
      setPrice(c > 0 ? String(c + MARKUP) : "");
    }
  }, [cost, priceTouched]);

  function toggle<T>(list: T[], v: T, set: (l: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit() {
    setError(null);
    const priceP = Math.round(Number(price) * 100);
    const mrpP = Math.round(Number(mrp || price) * 100);
    if (!name.trim()) return setError("Product name is required.");
    if (!imageUrl.trim()) return setError("Paste an image URL you have the rights to use.");
    if (priceP < 100) return setError("Enter a valid selling price.");
    if (mrpP < priceP) return setError("MRP cannot be below the selling price.");
    if (sizes.length === 0) return setError("Pick at least one size.");

    setBusy(true);
    try {
      const res = await authedFetch("/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categorySlug,
          price: priceP,
          mrp: mrpP,
          description: description.trim() || undefined,
          fit,
          fabric: fabric.trim() || undefined,
          imageUrl: imageUrl.trim(),
          colors,
          sizes,
          stock: Number(stock) || 0,
          badges,
          publish,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(Array.isArray(data.message) ? data.message[0] : (data.message ?? "Failed."));
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create product.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full border border-paper/25 bg-ink px-2.5 py-2 text-sm outline-none focus:border-volt";
  const margin = Number(price) - Number(cost);

  return (
    <div className="mb-6 border border-paper/15 bg-ink-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="display text-2xl">Add Product</h2>
        <button onClick={onClose} aria-label="Close" className="p-1 hover:text-blood">
          <X size={20} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name + category */}
        <label className="text-xs sm:col-span-2">
          <span className="mb-1 block font-semibold text-paper-dim">PRODUCT NAME *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Oversized Graphic Tee" className={inputCls} />
        </label>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">CATEGORY</span>
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">FIT</span>
          <select value={fit} onChange={(e) => setFit(e.target.value)} className={inputCls}>
            {FITS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        {/* Pricing — the +₹200 markup engine */}
        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">YOUR COST — maxzone ₹</span>
          <input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} placeholder="599" className={inputCls} />
        </label>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">
            SELLING PRICE ₹ <span className="text-volt">(cost + {MARKUP})</span>
          </span>
          <input
            inputMode="numeric"
            value={price}
            onChange={(e) => { setPriceTouched(true); setPrice(e.target.value.replace(/\D/g, "")); }}
            placeholder="799"
            className={cn(inputCls, "border-volt/50")}
          />
        </label>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">MRP ₹ (strike-through, optional)</span>
          <input inputMode="numeric" value={mrp} onChange={(e) => setMrp(e.target.value.replace(/\D/g, ""))} placeholder="1299" className={inputCls} />
        </label>

        <div className="flex items-end text-xs">
          {Number(cost) > 0 && Number(price) > 0 && (
            <p className={cn("py-2", margin >= 0 ? "text-volt" : "text-blood")}>
              Profit per piece: <strong>₹{margin}</strong>
            </p>
          )}
        </div>

        {/* Image */}
        <label className="text-xs sm:col-span-2">
          <span className="mb-1 block font-semibold text-paper-dim">IMAGE URL * (a photo you have rights to)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/your-photo.jpg" className={inputCls} />
        </label>
        {imageUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL, not a storefront asset
          <img src={imageUrl} alt="preview" className="h-28 w-auto border border-paper/15 object-cover sm:col-span-2" />
        )}

        {/* Colours */}
        <div className="text-xs sm:col-span-2">
          <span className="mb-1 block font-semibold text-paper-dim">COLOURS</span>
          <div className="space-y-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                  className="h-8 w-10 cursor-pointer border border-paper/25 bg-ink"
                />
                <input
                  value={c.name}
                  onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Colour name"
                  className={cn(inputCls, "flex-1")}
                />
                {colors.length > 1 && (
                  <button onClick={() => setColors(colors.filter((_, j) => j !== i))} className="p-1 text-paper-dim hover:text-blood">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setColors([...colors, { name: "", hex: "#888888" }])}
              className="flex items-center gap-1 text-xs text-volt hover:underline"
            >
              <Plus size={13} /> Add colour
            </button>
          </div>
        </div>

        {/* Sizes */}
        <div className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">SIZES</span>
          <div className="flex flex-wrap gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => toggle(sizes, s, setSizes)}
                className={cn(
                  "display border px-2.5 py-1.5 text-sm",
                  sizes.includes(s) ? "border-paper bg-paper text-ink" : "border-paper/30",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">STOCK per size/colour</span>
          <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={inputCls} />
        </label>

        {/* Badges + fabric */}
        <div className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">BADGES (optional)</span>
          <div className="flex flex-wrap gap-1.5">
            {BADGES.map((b) => (
              <button
                key={b}
                onClick={() => toggle(badges, b, setBadges)}
                className={cn(
                  "display border px-2 py-1 text-[10px]",
                  badges.includes(b) ? "border-volt bg-volt/15 text-volt" : "border-paper/25 text-paper-dim",
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <label className="text-xs">
          <span className="mb-1 block font-semibold text-paper-dim">FABRIC (optional)</span>
          <input value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="240 GSM Cotton" className={inputCls} />
        </label>

        <label className="text-xs sm:col-span-2">
          <span className="mb-1 block font-semibold text-paper-dim">DESCRIPTION (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={cn(inputCls, "resize-y")} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="accent-volt" />
          Publish immediately (live on store)
        </label>
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="display ml-auto bg-volt px-6 py-2.5 text-base text-ink disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Create Product"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-blood">{error}</p>}
    </div>
  );
}
