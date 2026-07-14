import Image from "next/image";
import Link from "next/link";
import { FadeUp } from "@/components/motion";
import type { CategoryData } from "@/lib/types";

/** Bold image tiles linking to each category. */
export function CategoryTiles({ categories }: { categories: CategoryData[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <FadeUp>
        <h2 className="display mb-6 text-4xl sm:text-5xl">
          Shop By <span className="text-volt">Category</span>
        </h2>
      </FadeUp>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {categories.map((cat, i) => (
          <FadeUp key={cat.id} delay={i * 0.06} className={i === 0 ? "col-span-2 lg:col-span-1" : ""}>
            <Link
              href={`/category/${cat.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-ink-2"
            >
              {cat.image && (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 20vw"
                  className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent" />
              <div className="absolute inset-x-3 bottom-3">
                <h3 className="display text-xl leading-tight text-paper transition-colors group-hover:text-volt sm:text-2xl">
                  {cat.name}
                </h3>
                <p className="text-xs text-paper-dim">{cat._count.products} styles</p>
              </div>
            </Link>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
