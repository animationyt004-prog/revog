// Shapes returned by the NO CURFEW API (apps/api). Prices are in PAISE.

export type StockLabel = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT";

export type BadgeType = "NEW" | "TRENDING" | "LIMITED" | "BESTSELLER" | "SALE";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  mrp: number;
  price: number;
  discountPercent: number;
  fit: string;
  badges: BadgeType[];
  ratingAvg: number;
  ratingCount: number;
  category: { name: string; slug: string } | null;
  image: { url: string; alt: string } | null;
  hoverImage: { url: string; alt: string } | null;
  colors: { name: string; hex: string }[];
  totalStock: number;
  stockLabel: StockLabel;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
}
