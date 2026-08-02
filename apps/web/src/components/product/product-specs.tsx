import type { ProductDetail } from "@/lib/types";

/**
 * The spec sheet buyers scan before adding to cart — length, whether a blouse
 * is included, how to wash it, and whether the fabric is see-through. Every
 * row is optional: only what the product actually declares is rendered, so a
 * product without these values shows nothing rather than blank rows.
 */
export function ProductSpecs({ product }: { product: ProductDetail }) {
  const rows: { label: string; value: string }[] = [
    { label: "Saree length", value: product.sareeLength ?? "" },
    { label: "Blouse", value: product.blouseDetails ?? "" },
    { label: "Fabric", value: product.fabric ?? "" },
    { label: "Transparency", value: product.transparency ?? "" },
    { label: "Occasion", value: product.occasion ?? "" },
    { label: "Wash care", value: product.washCare ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="display mb-2.5 text-lg text-paper">Product Details</h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-paper/10 py-2.5"
          >
            <dt className="shrink-0 text-paper-dim/70">{row.label}</dt>
            <dd className="text-right text-paper">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-paper-dim/70">
        Easy 7-day returns &amp; exchanges · Cash on Delivery available · Dispatched in 1–2 working
        days
      </p>
    </div>
  );
}
