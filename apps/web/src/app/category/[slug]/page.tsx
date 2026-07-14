import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories } from "@/lib/api";
import type { SearchParams } from "@/lib/catalog-params";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: category ? category.name : "Category",
    description: category?.description ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) notFound();

  // Split the name so the last word gets the accent colour.
  const words = category.name.split(" ");
  const accent = words.pop() ?? "";

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
      <Footer />
    </>
  );
}
