import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategorySeoContent } from "@/components/catalog/category-seo";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories } from "@/lib/api";
import { getCategorySeo } from "@/lib/category-seo";
import type { SearchParams } from "@/lib/catalog-params";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = getCategorySeo(slug);
  const category = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: seo?.metaTitle ?? (category ? category.name : "Category"),
    description: seo?.metaDescription ?? category?.description ?? undefined,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) notFound();

  // Split the name so the last word gets the accent colour.
  const words = category.name.split(" ");
  const accent = words.pop() ?? "";

  const seo = getCategorySeo(slug);
  const faqJsonLd =
    seo?.faqs && seo.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seo.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <>
      <PromoTicker />
      <Navbar />
      <CatalogView
        title={words.join(" ") || accent}
        accent={words.length ? accent : "."}
        blurb={category.description}
        scope={{ category: slug }}
        searchParams={sp}
      />
      <CategorySeoContent slug={slug} />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Footer />
    </>
  );
}
