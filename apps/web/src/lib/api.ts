import type { CategoryData, ProductCardData } from "./types";

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

export function getProducts(opts: {
  collection?: Collection;
  category?: string;
  take?: number;
} = {}): Promise<ProductCardData[]> {
  const params = new URLSearchParams();
  if (opts.collection) params.set("collection", opts.collection);
  if (opts.category) params.set("category", opts.category);
  if (opts.take) params.set("take", String(opts.take));
  const qs = params.size ? `?${params}` : "";
  return get<ProductCardData[]>(`/products${qs}`, []);
}

export function getCategories(): Promise<CategoryData[]> {
  return get<CategoryData[]>("/categories", []);
}
