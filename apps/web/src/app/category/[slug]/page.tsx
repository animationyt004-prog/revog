import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { CategorySeoContent } from "@/components/catalog/category-seo";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories } from "@/lib/api";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
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
  const title = seo?.metaTitle ?? (category ? category.name : "Category");
  const description = seo?.metaDescription ?? category?.description ?? undefined;
  // Same rule as collections: an empty category is thin content. Crawlable,
  // so its internal links still count, but out of the index until it stocks.
  const empty = !category || category._count.products === 0;
  return {
    title,
    description,
    ...(empty ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/category/${slug}` },
    // Child openGraph replaces the root's wholesale, so images must repeat here
    // or shared links lose their preview card.
    openGraph: {
      type: "website",
      title: `${title} | Hyra Fashion`,
      description,
      url: `/category/${slug}`,
      images: [{ url: "/og-logo.png", width: 1200, height: 630, alt: "Hyra Fashion" }],
    },
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

  const crumbs = breadcrumbJsonLd([
    { name: category.name, path: `/category/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
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
