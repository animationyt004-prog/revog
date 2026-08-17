import Image from "next/image";
import Link from "next/link";
import { FadeUp } from "@/components/motion";
import { COLLECTIONS, stockedCollectionSlugs } from "@/lib/collections";
import type { ProductCardData } from "@/lib/types";

/**
 * Occasion-first discovery: most shoppers arrive knowing the event, not the
 * fabric. CategoryTiles above mixes fabric, price and occasion into one
 * editorial grid; this row is only occasions, so someone shopping for a
 * reception can skip straight there.
 *
 * Wedding and Bridesmaid are deliberately absent. Neither exists as a
 * collection, and collections.ts is explicit that only stocked ones get
 * listed - an occasion tile leading to an empty page reads as a broken shop
 * and earns nothing in search. They can be added the moment the catalogue
 * supports them.
 */
const OCCASIONS: {
  slug: string;
  label: string;
  note: string;
  /** Picks a representative photo from the catalogue we already loaded. */
  match: RegExp;
}[] = [
  {
    slug: "festive-sarees",
    label: "Festive",
    note: "Zari, embroidery and occasion colour",
    match: /zari|embroider|festive|traditional|banarasi|silk/i,
  },
  {
    slug: "party-wear-sarees",
    label: "Party",
    note: "Statement looks for evenings out",
    match: /sequin|mirror|pearl|party|shimmer|net/i,
  },
  {
    slug: "office-wear-sarees",
    label: "Office",
    note: "Refined drapes for working days",
    match: /cotton|linen|print|tissue/i,
  },
  {
    slug: "daily-wear-sarees",
    label: "Daily wear",
    note: "Light, easy and comfortable",
    match: /georgette|chiffon|daily|light/i,
  },
];

export async function ShopByOccasion({
  products = [],
}: {
  products?: ProductCardData[];
}) {
  const stocked = new Set(await stockedCollectionSlugs());
  const withImages = products.filter((product) => product.image);
  const used = new Set<string>();

  const tiles = OCCASIONS.filter(
    (occasion) => stocked.has(occasion.slug) && COLLECTIONS[occasion.slug],
  )
    .map((occasion) => {
      // Prefer a photo whose product actually reads like the occasion, then
      // any unused one, so four tiles never show the same saree twice.
      const picked =
        withImages.find(
          (product) =>
            occasion.match.test(product.name) && !used.has(product.image!.url),
        ) ?? withImages.find((product) => !used.has(product.image!.url));
      if (picked?.image) used.add(picked.image.url);
      return { ...occasion, image: picked?.image?.url ?? null };
    })
    .filter((tile) => tile.image);

  // Below three, this becomes a duplicate rather than a section: CategoryTiles
  // directly above already carries "Party wear" and "Festive edit" pointing at
  // these same two collections, so a two-circle row repeats them and adds
  // nothing. As of 2026-08-16 only Party (17 products) and Festive (15) carry
  // occasion tags at all - Daily and Office are tagged on zero products, so
  // this section stays hidden until the catalogue is tagged.
  if (tiles.length < 3) return null;

  return (
    <section aria-labelledby="shop-by-occasion" className="bg-ink">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeUp>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-volt">
            Shop by occasion
          </p>
          <h2
            id="shop-by-occasion"
            className="display mt-2 max-w-xl text-3xl text-paper sm:text-4xl"
          >
            Where are you wearing it?
          </h2>
        </FadeUp>

        <FadeUp>
          <ul className="mt-9 grid grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 lg:gap-x-10">
            {tiles.map((tile) => (
              <li key={tile.slug}>
                <Link
                  href={`/collections/${tile.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Circular crop keeps four very different photographs
                      reading as one set, which a rectangle does not. */}
                  <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-ink-3">
                    <Image
                      src={tile.image!}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 640px) 22vw, (max-width: 1024px) 20vw, 220px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full ring-1 ring-inset ring-paper/10 transition-colors group-hover:ring-gold"
                    />
                  </span>
                  <span className="mt-3 text-xs font-semibold leading-snug text-paper sm:text-sm">
                    {tile.label}
                  </span>
                  {/* Hidden on phones: four captions under four circles at
                      375px wraps to three lines each and buries the row. */}
                  <span className="mt-1 hidden text-xs leading-snug text-paper-dim sm:block">
                    {tile.note}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
