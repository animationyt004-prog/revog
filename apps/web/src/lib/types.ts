// Shapes returned by the REVOG API (apps/api). Prices are in PAISE.

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
  variants: { id: string; size: string; color: string; stock: number }[];
  totalStock: number;
  stockLabel: StockLabel;
}

export interface ProductImageData {
  id: string;
  url: string;
  alt: string | null;
  color: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantData {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  priceOverride: number | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  gender: string;
  fit: string;
  fabric: string | null;
  mrp: number;
  price: number;
  badges: BadgeType[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  category: { name: string; slug: string } | null;
  images: ProductImageData[];
  variants: ProductVariantData[];
}

export interface CartItemData {
  id: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  color: string;
  image: string | null;
  unitPrice: number;
  mrp: number;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface CartSummary {
  itemCount: number;
  mrpTotal: number;
  subtotal: number;
  mrpSavings: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  taxIncluded: number;
  total: number;
  totalSavings: number;
}

export interface CartView {
  id: string;
  items: CartItemData[];
  summary: CartSummary;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  couponCode: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  addressSnapshot: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  placedAt: string;
  items: {
    id: string;
    productName: string;
    variantLabel: string;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  events?: { id: string; status: string; note: string | null; createdAt: string }[];
}

export interface AddressData {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
}
