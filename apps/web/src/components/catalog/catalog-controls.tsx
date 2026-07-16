"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn, sizeLabel } from "@/lib/format";
import type { Facets, SortKey } from "@/lib/api";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount", label: "Biggest Discount" },
  { value: "rating", label: "Top Rated" },
];

const FIT_LABELS: Record<string, string> = {
  OVERSIZED: "Oversized",
  REGULAR: "Regular",
  RELAXED: "Relaxed",
  SLIM: "Slim",
  BAGGY: "Baggy",
};

export function CatalogControls({
  facets,
  total,
}: {
  facets: Facets;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = useCallback(
    (key: string): string[] => search.get(key)?.split(",").filter(Boolean) ?? [],
    [search],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(search.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, search],
  );

  const toggleValue = useCallback(
    (key: string, value: string) => {
      const values = selected(key);
      const next = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      setParam(key, next.length ? next.join(",") : null);
    },
    [selected, setParam],
  );

  // Price range (rupees). Local state while dragging; URL on release.
  const rupeeMin = Math.floor(facets.priceRange.min / 100);
  const rupeeMax = Math.ceil(facets.priceRange.max / 100);
  const [priceDraft, setPriceDraft] = useState<[number, number]>([
    Number(search.get("min")) || rupeeMin,
    Number(search.get("max")) || rupeeMax,
  ]);
  useEffect(() => {
    setPriceDraft([
      Number(search.get("min")) || rupeeMin,
      Number(search.get("max")) || rupeeMax,
    ]);
  }, [search, rupeeMin, rupeeMax]);

  function commitPrice([lo, hi]: [number, number]) {
    const params = new URLSearchParams(search.toString());
    if (lo > rupeeMin) params.set("min", String(lo));
    else params.delete("min");
    if (hi < rupeeMax) params.set("max", String(hi));
    else params.delete("max");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const activeCount =
    selected("sizes").length +
    selected("colors").length +
    selected("fits").length +
    selected("fabrics").length +
    (search.get("min") || search.get("max") ? 1 : 0);

  function clearAll() {
    const params = new URLSearchParams(search.toString());
    ["sizes", "colors", "fits", "fabrics", "min", "max"].forEach((k) =>
      params.delete(k),
    );
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="mt-6">
      {/* Control bar */}
      <div className="flex items-center justify-between gap-3 border-y border-paper/10 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "display flex items-center gap-2 border px-4 py-2 text-base transition-colors",
            open || activeCount > 0
              ? "border-paper bg-paper text-ink"
              : "border-paper/30 hover:border-paper",
          )}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-xs text-ink">
              {activeCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3">
          <span className={cn("text-xs text-paper-dim", isPending && "animate-pulse")}>
            {total} styles
          </span>
          <label className="relative">
            <span className="sr-only">Sort by</span>
            <select
              value={search.get("sort") ?? "newest"}
              onChange={(e) => setParam("sort", e.target.value === "newest" ? null : e.target.value)}
              className="appearance-none border border-paper/30 bg-ink py-2 pl-3 pr-8 text-sm outline-none focus:border-volt"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-paper-dim"
            />
          </label>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-paper/10"
          >
            <div className="grid gap-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Sizes */}
              {facets.sizes.length > 0 && (
                <fieldset>
                  <legend className="display mb-2.5 text-lg">Size</legend>
                  <div className="flex flex-wrap gap-2">
                    {facets.sizes.map((s) => {
                      const active = selected("sizes").includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleValue("sizes", s)}
                          aria-pressed={active}
                          className={cn(
                            "display min-w-10 border px-2.5 py-1.5 text-sm transition-colors",
                            active
                              ? "border-paper bg-paper text-ink"
                              : "border-paper/30 hover:border-paper",
                          )}
                        >
                          {sizeLabel(s)}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Colors */}
              {facets.colors.length > 0 && (
                <fieldset>
                  <legend className="display mb-2.5 text-lg">Colour</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {facets.colors.map((c) => {
                      const active = selected("colors").includes(c.name);
                      return (
                        <button
                          key={c.name}
                          title={c.name}
                          aria-pressed={active}
                          onClick={() => toggleValue("colors", c.name)}
                          className={cn(
                            "relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                            active ? "border-volt" : "border-paper/25",
                          )}
                          style={{ backgroundColor: c.hex }}
                        >
                          {active && (
                            <Check
                              size={14}
                              strokeWidth={3}
                              className={cn(
                                "absolute inset-0 m-auto",
                                // readable check on light swatches
                                ["Off White", "Sand", "Lavender"].includes(c.name)
                                  ? "text-ink"
                                  : "text-white",
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Fit */}
              {facets.fits.length > 0 && (
                <fieldset>
                  <legend className="display mb-2.5 text-lg">Fit</legend>
                  <div className="flex flex-wrap gap-2">
                    {facets.fits.map((f) => {
                      const active = selected("fits").includes(f);
                      return (
                        <button
                          key={f}
                          onClick={() => toggleValue("fits", f)}
                          aria-pressed={active}
                          className={cn(
                            "border px-3 py-1.5 text-sm transition-colors",
                            active
                              ? "border-paper bg-paper text-ink"
                              : "border-paper/30 hover:border-paper",
                          )}
                        >
                          {FIT_LABELS[f] ?? f}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Price */}
              <fieldset>
                <legend className="display mb-2.5 text-lg">Price</legend>
                <p className="mb-2 text-sm text-paper-dim">
                  ₹{priceDraft[0].toLocaleString("en-IN")} — ₹
                  {priceDraft[1].toLocaleString("en-IN")}
                </p>
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-[11px] text-paper-dim">MIN</span>
                    <input
                      type="range"
                      min={rupeeMin}
                      max={rupeeMax}
                      value={priceDraft[0]}
                      onChange={(e) =>
                        setPriceDraft(([, hi]) => [
                          Math.min(Number(e.target.value), hi),
                          hi,
                        ])
                      }
                      onMouseUp={() => commitPrice(priceDraft)}
                      onTouchEnd={() => commitPrice(priceDraft)}
                      className="w-full accent-volt"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-paper-dim">MAX</span>
                    <input
                      type="range"
                      min={rupeeMin}
                      max={rupeeMax}
                      value={priceDraft[1]}
                      onChange={(e) =>
                        setPriceDraft(([lo]) => [
                          lo,
                          Math.max(Number(e.target.value), lo),
                        ])
                      }
                      onMouseUp={() => commitPrice(priceDraft)}
                      onTouchEnd={() => commitPrice(priceDraft)}
                      className="w-full accent-volt"
                    />
                  </label>
                </div>
              </fieldset>

              {/* Fabric — full-width row under the grid when present */}
              {facets.fabrics.length > 0 && (
                <fieldset className="sm:col-span-2 lg:col-span-4">
                  <legend className="display mb-2.5 text-lg">Fabric</legend>
                  <div className="flex flex-wrap gap-2">
                    {facets.fabrics.map((f) => {
                      const active = selected("fabrics").includes(f);
                      return (
                        <button
                          key={f}
                          onClick={() => toggleValue("fabrics", f)}
                          aria-pressed={active}
                          className={cn(
                            "border px-3 py-1.5 text-xs transition-colors",
                            active
                              ? "border-paper bg-paper text-ink"
                              : "border-paper/30 hover:border-paper",
                          )}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="mb-5 flex items-center gap-1.5 text-sm text-blood underline underline-offset-4"
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
