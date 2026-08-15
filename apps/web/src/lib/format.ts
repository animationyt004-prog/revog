import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format paise as rupees: 89900 -> "₹899" */
export function formatPrice(paise: number): string {
  return inr.format(paise / 100);
}

/** Human label for a size enum value ("FREE_SIZE" -> "Free Size"). */
export function sizeLabel(size: string): string {
  return size === "FREE_SIZE" ? "Free Size" : size;
}

/**
 * Card-sized version of a supplier product name.
 *
 * Names arrive built for a marketplace listing — "Women Zari Embroidered
 * Georgette Saree with Scalloped Border & Matching Blouse", 67 characters on
 * average — and a grid of those reads as a spreadsheet. Everything from
 * "with" onwards is detail the product page already carries, so it goes.
 *
 * The catch is collisions. Cutting at "with" unconditionally turns three
 * different products into "Shimmer Saree" and two more into "Georgette
 * Saree", which is worse than the long name: the customer cannot tell the
 * cards apart. So a head of fewer than three words is treated as too generic
 * to stand alone and keeps the first clause after "with" to distinguish it.
 *
 * Use this for display only. The full name stays on the product page, in the
 * metadata and in the card's aria-label, so nothing is lost to search or to a
 * screen reader.
 */
export function shortProductName(name: string): string {
  const stripped = name.replace(/^(women'?s?|hyraluxe)\s+/i, "").trim();
  const [head, separator, tail] = stripped.split(/(\s+with\s+)/i);
  if (!separator || !tail) return stripped;
  if (head.split(/\s+/).length >= 3) return head;
  const clause = tail.split(/\s*(?:[&,]|\band\b)\s*/i)[0];
  return `${head} with ${clause}`.trim();
}
