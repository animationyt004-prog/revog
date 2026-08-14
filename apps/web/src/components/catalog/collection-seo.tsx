import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCollectionSeo } from "@/lib/collection-seo";

export function CollectionSeoContent({ slug }: { slug: string }) {
  const seo = getCollectionSeo(slug);
  if (!seo) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="border-t border-paper/15 pt-10 sm:pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-volt">
          The HyraLuxe guide
        </p>
        <h2 className="display mt-2 max-w-3xl text-2xl sm:text-4xl">{seo.heading}</h2>

        <div className="mt-5 grid gap-4 text-sm leading-7 text-paper-dim md:grid-cols-2 md:gap-8">
          {seo.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 border-t border-paper/10 pt-8">
          <h3 className="display text-xl sm:text-2xl">Frequently asked questions</h3>
          <div className="mt-4 divide-y divide-paper/10 border-y border-paper/10">
            {seo.faqs.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-semibold text-paper">
                  {faq.q}
                  <ChevronRight
                    size={17}
                    className="shrink-0 text-volt transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="max-w-3xl pt-3 text-sm leading-6 text-paper-dim">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <nav aria-label="Related saree collections" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {seo.related.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b border-paper/25 pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:border-volt hover:text-volt"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
