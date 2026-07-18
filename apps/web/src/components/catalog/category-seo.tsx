import { getCategorySeo } from "@/lib/category-seo";

/** Long-form SEO content block rendered below the product grid. Server-rendered
 *  so the copy is in the initial HTML for crawlers. Renders nothing for
 *  categories without configured copy. */
export function CategorySeoContent({ slug }: { slug: string }) {
  const seo = getCategorySeo(slug);
  if (!seo) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <div className="border-t border-paper/10 pt-10">
        <h2 className="display text-2xl sm:text-3xl">{seo.heading}</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-paper-dim">
          {seo.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {seo.faqs && seo.faqs.length > 0 && (
          <div className="mt-10">
            <h3 className="display text-xl">Frequently Asked Questions</h3>
            <dl className="mt-4 space-y-4">
              {seo.faqs.map((f, i) => (
                <div key={i}>
                  <dt className="text-sm font-semibold text-paper">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-paper-dim">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
