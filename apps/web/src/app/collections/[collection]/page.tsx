import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { COLLECTIONS, collectionCount } from "@/lib/collections";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
import type { SearchParams } from "@/lib/catalog-params";

interface Props {
  params: Promise<{ collection: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const meta = COLLECTIONS[collection];
  const title = meta?.seoTitle ?? (meta ? `${meta.title} ${meta.accent}` : "Collection");
  const description = meta?.seoDescription ?? meta?.blurb;
  // A collection with nothing in it is thin content: it cannot rank on its own
  // and it dilutes the pages that can. Keep it crawlable so the links out of it
  // still flow, but out of the index until it has stock.
  const empty = meta ? (await collectionCount(meta)) === 0 : true;
  return {
    title,
    description,
    ...(empty ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/collections/${collection}` },
    // Child openGraph replaces the root's wholesale, so images must repeat here
    // or shared links lose their preview card.
    openGraph: {
      type: "website",
      title: `${title} | Hyra Fashion`,
      description,
      url: `/collections/${collection}`,
      images: [{ url: "/og-logo.png", width: 1200, height: 630, alt: "Hyra Fashion" }],
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ collection }, sp] = await Promise.all([params, searchParams]);
  const meta = COLLECTIONS[collection];
  if (!meta) notFound();

  const crumbs = breadcrumbJsonLd([
    {
      name: `${meta.title} ${meta.accent}`,
      path: `/collections/${collection}`,
    },
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
        title={meta.title}
        accent={meta.accent}
        blurb={meta.blurb}
        scope={
          meta.api
            ? { collection: meta.api }
            : { category: meta.filters?.category }
        }
        baseFilters={meta.filters}
        searchParams={sp}
      />
      <Footer />
    </>
  );
}
