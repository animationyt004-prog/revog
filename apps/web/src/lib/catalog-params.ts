import type { ProductFilters, SortKey } from "./api";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = [
  "newest",
  "popular",
  "price_asc",
  "price_desc",
  "discount",
  "rating",
];

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] | undefined {
  const s = str(v);
  if (!s) return undefined;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

/** URL search params -> API filters. Prices are RUPEES in the URL
 *  (readable/shareable), PAISE at the API. */
export function parseCatalogParams(sp: SearchParams): ProductFilters {
  const min = Number(str(sp.min));
  const max = Number(str(sp.max));
  const sort = str(sp.sort) as SortKey | undefined;
  return {
    sizes: list(sp.sizes),
    colors: list(sp.colors),
    fits: list(sp.fits),
    fabrics: list(sp.fabrics),
    minPrice: Number.isFinite(min) && min > 0 ? Math.round(min * 100) : undefined,
    maxPrice: Number.isFinite(max) && max > 0 ? Math.round(max * 100) : undefined,
    sort: sort && SORT_KEYS.includes(sort) ? sort : undefined,
  };
}

export function countActiveFilters(f: ProductFilters): number {
  return (
    (f.sizes?.length ?? 0) +
    (f.colors?.length ?? 0) +
    (f.fits?.length ?? 0) +
    (f.fabrics?.length ?? 0) +
    (f.minPrice != null || f.maxPrice != null ? 1 : 0)
  );
}
