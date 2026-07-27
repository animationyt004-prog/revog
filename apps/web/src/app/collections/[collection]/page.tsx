import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import type { Collection } from "@/lib/api";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
import type { SearchParams } from "@/lib/catalog-params";

const COLLECTIONS: Record<
  string,
  { api: Collection; title: string; accent: string; blurb: string }
> = {
  "new-arrivals": {
    api: "new",
    title: "New",
    accent: "Drops",
    blurb: "Fresh off the press. The latest Hyra Fashion releases.",
  },
  trending: {
    api: "trending",
    title: "Trending",
    accent: "Now",
    blurb: "What the streets are wearing right now.",
  },
  limited: {
    api: "limited",
    title: "Limited",
    accent: "Edition",
    blurb: "Numbered runs. Once they're gone, they're gone.",
  },
  bestsellers: {
    api: "bestsellers",
    title: "Best",
    accent: "Sellers",
    blurb: "Proven favourites, restocked while we can.",
  },
};

interface Props {
  params: Promise<{ collection: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const meta = COLLECTIONS[collection];
  const title = meta ? `${meta.title} ${meta.accent}` : "Collection";
  return {
    title,
    description: meta?.blurb,
    alternates: { canonical: `/collections/${collection}` },
    // Child openGraph replaces the root's wholesale, so images must repeat here
    // or shared links lose their preview card.
    openGraph: {
      type: "website",
      title: `${title} | Hyra Fashion`,
      description: meta?.blurb,
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
        scope={{ collection: meta.api }}
        searchParams={sp}
      />
      <Footer />
    </>
  );
}
