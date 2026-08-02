import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/lib/types";

/**
 * Three editorial tiles under the category row. Each one points at a real
 * listing that already has stock — an empty landing page behind a banner this
 * prominent costs more trust than the banner earns.
 *
 * Artwork comes from the catalogue rather than separate creative, so the tiles
 * can never drift out of sync with what is actually for sale.
 */
const TILES = [
  {
    title: "Wedding",
    accent: "Collection",
    href: "/collections/bestsellers",
    cta: "Explore now",
  },
  {
    title: "Festive",
    accent: "Edit",
    href: "/collections/trending",
    cta: "Shop now",
  },
  {
    title: "Premium",
    accent: "Silk Sarees",
    href: "/category/sarees",
    cta: "Shop now",
  },
];

export function CollectionBanners({ products = [] }: { products?: ProductCardData[] }) {
  const shots = products.filter((p) => p.image);
  if (shots.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
        {TILES.map((tile, i) => {
          const shot = shots[i % shots.length].image;
          return (
            <Link
              key={tile.title}
              href={tile.href}
              className="group relative isolate block overflow-hidden bg-ink-2"
            >
              {shot && (
                <Image
                  src={shot.url}
                  alt=""
                  aria-hidden
                  width={640}
                  height={420}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="aspect-[3/2] w-full object-cover object-[50%_22%] transition-transform duration-700 group-hover:scale-[1.04]"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent"
              />
              <div className="absolute inset-y-0 left-0 flex max-w-[75%] flex-col justify-center p-5 sm:p-6">
                <p className="display text-2xl leading-tight text-paper sm:text-3xl">
                  {tile.title}
                  <span className="block">{tile.accent}</span>
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-paper">
                  {tile.cta}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
