import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeUp } from "@/components/motion";
import type { CategoryData, ProductCardData } from "@/lib/types";

type Edit = {
  label: string;
  note: string;
  href: string;
  image: string | null;
};

export function CategoryTiles({
  categories,
  products = [],
}: {
  categories: CategoryData[];
  products?: ProductCardData[];
}) {
  const stockedCategory = categories.find((category) => category._count.products > 0);
  const availableProducts = products.filter((product) => product.image);
  const usedImages = new Set<string>();
  const pickImage = (test: (product: ProductCardData) => boolean, fallbackIndex: number) => {
    const selected =
      availableProducts.find(
        (product) => test(product) && !usedImages.has(product.image!.url),
      ) ??
      availableProducts.find((product) => !usedImages.has(product.image!.url)) ??
      availableProducts[fallbackIndex];
    const image = selected?.image?.url ?? null;
    if (image) usedImages.add(image);
    return image;
  };
  const edits: Edit[] = [
    {
      label: "New arrivals",
      note: "The latest HyraLuxe pieces",
      href: "/collections/new-arrivals",
      image: pickImage(() => true, 0),
    },
    {
      label: "Party wear",
      note: "For evenings worth dressing for",
      href: "/collections/party-wear-sarees",
      image: pickImage((product) => /sequin|mirror|pearl|party/i.test(product.name), 1),
    },
    {
      label: "Georgette",
      note: "Light drapes, graceful movement",
      href: "/collections/georgette-sarees",
      image: pickImage((product) => /georgette/i.test(product.name), 2),
    },
    {
      label: "Festive edit",
      note: "Zari, embroidery and occasion colour",
      href: "/collections/festive-sarees",
      image: pickImage((product) => /zari|embroider|festive|traditional/i.test(product.name), 3),
    },
    {
      label: "Under Rs.999",
      note: "Considered style, honest pricing",
      href: "/collections/sarees-under-999",
      image: pickImage((product) => product.price <= 99900, 4),
    },
  ].filter((edit) => edit.image);

  if (edits.length === 0 && !stockedCategory) return null;

  if (edits.length === 0 && stockedCategory) {
    edits.push({
      label: stockedCategory.name,
      note: "Explore the complete collection",
      href: `/category/${stockedCategory.slug}`,
      image: stockedCategory.image,
    });
  }

  return (
    <section className="bg-ink-2">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeUp>
          <div className="mb-8 grid gap-4 border-b border-paper/15 pb-6 sm:mb-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-volt">
                The HyraLuxe edit
              </p>
              <h2 className="display mt-2 max-w-2xl text-3xl text-paper sm:text-5xl">
                Dress for the moment.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-paper-dim">
              Sarees selected for their drape, detail and the occasions you will remember.
            </p>
          </div>
        </FadeUp>

        <ul className="grid grid-cols-2 gap-2 sm:gap-4 lg:auto-rows-[260px] lg:grid-cols-4">
          {edits.map((edit, index) => (
            <FadeUp
              key={edit.href}
              delay={index * 0.05}
              className={index === 0 ? "col-span-2 lg:row-span-2" : ""}
            >
              <li className="h-full">
                <Link
                  href={edit.href}
                  className="group relative block h-full min-h-[230px] overflow-hidden bg-ink sm:min-h-[280px] lg:min-h-0"
                >
                  {edit.image && (
                    <Image
                      src={edit.image}
                      alt=""
                      aria-hidden
                      fill
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-6">
                    <span>
                      <span className="display block text-xl sm:text-3xl">{edit.label}</span>
                      <span className="mt-1 hidden text-xs text-white/70 sm:block">{edit.note}</span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/40 transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-night">
                      <ArrowUpRight size={17} aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}
