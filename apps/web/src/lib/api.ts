import type { CategoryData, ProductCardData, ProductDetail } from "./types";

// Server components use API_URL (reachable from the Node process);
// the browser uses NEXT_PUBLIC_API_URL.
const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:3001/api")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api");

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      // ISR: cached at the edge, refreshed every 60s.
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    // API down (e.g. during dev restarts) — render the page with empty
    // sections instead of crashing the storefront.
    return fallback;
  }
}

export type Collection = "new" | "trending" | "limited" | "bestsellers";
export type SortKey =
  | "newest"
  | "popular"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "rating";

export interface ProductFilters {
  collection?: Collection;
  category?: string;
  sizes?: string[];
  colors?: string[];
  fits?: string[];
  fabrics?: string[];
  minPrice?: number; // paise
  maxPrice?: number; // paise
  sort?: SortKey;
  take?: number;
  skip?: number;
}

export interface ProductList {
  items: ProductCardData[];
  total: number;
}

export interface Facets {
  sizes: string[];
  colors: { name: string; hex: string }[];
  fits: string[];
  fabrics: string[];
  priceRange: { min: number; max: number };
}

function filterParams(opts: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (opts.collection) params.set("collection", opts.collection);
  if (opts.category) params.set("category", opts.category);
  if (opts.sizes?.length) params.set("sizes", opts.sizes.join(","));
  if (opts.colors?.length) params.set("colors", opts.colors.join(","));
  if (opts.fits?.length) params.set("fits", opts.fits.join(","));
  if (opts.fabrics?.length) params.set("fabrics", opts.fabrics.join(","));
  if (opts.minPrice != null) params.set("minPrice", String(opts.minPrice));
  if (opts.maxPrice != null) params.set("maxPrice", String(opts.maxPrice));
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.take) params.set("take", String(opts.take));
  if (opts.skip) params.set("skip", String(opts.skip));
  return params;
}

export async function getProducts(opts: ProductFilters = {}): Promise<ProductCardData[]> {
  return (await getProductList(opts)).items;
}

export function getProductList(opts: ProductFilters = {}): Promise<ProductList> {
  const params = filterParams(opts);
  const qs = params.size ? `?${params}` : "";
  return get<ProductList>(`/products${qs}`, { items: [], total: 0 });
}

export function getFacets(scope: {
  category?: string;
  collection?: Collection;
}): Promise<Facets> {
  const params = new URLSearchParams();
  if (scope.category) params.set("category", scope.category);
  if (scope.collection) params.set("collection", scope.collection);
  const qs = params.size ? `?${params}` : "";
  return get<Facets>(`/products/facets${qs}`, {
    sizes: [],
    colors: [],
    fits: [],
    fabrics: [],
    priceRange: { min: 0, max: 0 },
  });
}

export function getRelated(slug: string): Promise<ProductCardData[]> {
  return get<ProductCardData[]>(`/products/${slug}/related`, []);
}

export interface PincodeResult {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  codAvailable?: boolean;
  etaMinDays?: number;
  etaMaxDays?: number;
}

export function getCategories(): Promise<CategoryData[]> {
  return get<CategoryData[]>("/categories", []);
}

export function getProduct(slug: string): Promise<ProductDetail | null> {
  return get<ProductDetail | null>(`/products/${slug}`, null);
}
