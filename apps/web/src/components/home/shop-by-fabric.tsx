import Image from "next/image";
import Link from "next/link";
import { FadeUp } from "@/components/motion";
import type { ProductCardData } from "@/lib/types";

/**
 * Fabric-first discovery: the row after occasions, for the shopper who knows
 * the drape before the event. Links run through the saree category's fabric
 * filter (?fabrics=Georgette), so a tile always lands on a real, stocked list.
 *
 * Tiles are derived from the products the homepage already loaded — no extra
 * fetch — and only fabrics that actually appear in that data get a tile, so
 * the row can never advertise a fabric the catalogue doesn't carry.
 */
const FABRIC_ORDER = [
  "Georgette",
  "Organza",
  "Shimmer",
  "Silk",
  "Cotton Silk",
  "Cotton Tissue",
  "Dola Silk",
  "Chiffon",
  "Crepe",
];

/** One line of "what this fabric is like", shown under the name. */
const FABRIC_NOTES: Record<string, string> = {
  Georgette: "Soft, light and easy to pleat",
  Organza: "Sheer and crisp with a formal fall",
  Shimmer: "Light-catching, made for evenings",
  Silk: "Classic drape with a quiet sheen",
  "Cotton Silk": "Breathable cotton with silk lustre",
  "Cotton Tissue": "Everyday cotton, a touch of shine",
  "Dola Silk": "Smooth, structured and festive",
  Chiffon: "Feather-light and flowing",
  Crepe: "Textured surface, holds its shape",
};

export function ShopByFabric({
  products = [],
}: {
  products?: ProductCardData[];
}) {
  // Count in-stock fabrics from loaded products, keeping insertion order.
  const counts = new Map<string, number>();
  for (const product of products) {
    const fabric = product.fabric?.trim();
    if (fabric && product.totalStock > 0) {
      counts.set(fabric, (counts.get(fabric) ?? 0) + 1);
    }
  }

  const fabrics = [...counts.entries()]
    .sort(
      ([a], [b]) =>
        (FABRIC_ORDER.indexOf(a) ?? 99) - (FABRIC_ORDER.indexOf(b) ?? 99),
    )
    .slice(0, 6);

  const withImages = products.filter((product) => product.image);
  const used = new Set<string>();

  const tiles = fabrics
    .map(([fabric, count]) => {
      // A photo of a saree actually made of this fabric, then any unused one,
      // so no two tiles share a photo.
      const picked =
        withImages.find(
          (product) =>
            product.fabric === fabric && !used.has(product.image!.url),
        ) ??
        withImages.find(
          (product) =>
            !used.has(product.image!.url) &&
            !counts.has(product.fabric?.trim() ?? ""),
        );
      if (picked?.image) used.add(picked.image.url);
      return { fabric, count, image: picked?.image ?? null };
    })
    .filter((tile) => tile.image);

  if (tiles.length < 3) return null;

  return (
    <section
      aria-label="Shop by fabric"
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20"
    >
      <FadeUp>
        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] text-paper-dim">
              DISCOVER BY FABRIC
            </p>
            <h2 className="display mt-2 text-3xl leading-tight sm:text-4xl">
              Find the drape
              <span className="text-gold"> you love.</span>
            </h2>
          </div>
          <Link
            href="/category/sarees"
            className="hidden shrink-0 items-center gap-1.5 text-sm text-paper-dim transition-colors hover:text-volt sm:inline-flex"
          >
            All sarees
          </Link>
        </div>
      </FadeUp>

      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {tiles.map(({ fabric, count, image }, index) => (
          <FadeUp key={fabric} delay={index * 0.05}>
            <li className="w-36 shrink-0 snap-start sm:w-full">
              <Link
                href={`/category/sarees?fabrics=${encodeURIComponent(fabric)}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink-2">
                  <Image
                    src={image!.url}
                    alt={`${fabric} saree`}
                    fill
                    sizes="(max-width: 640px) 36vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 to-transparent p-2.5 pt-8">
                    <span className="display block text-sm text-ink">
                      {fabric}
                    </span>
                    <span className="block text-[11px] text-ink/70">
                      {count} saree{count > 1 ? "s" : ""}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          </FadeUp>
        ))}
      </ul>
    </section>
  );
}
