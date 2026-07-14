import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { ProductSection } from "@/components/home/product-section";
import { ProductView } from "@/components/product/product-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { getProduct, getRelated } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not Found" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      title: `${product.name} | REVOG`,
      description: product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, related] = await Promise.all([
    getProduct(slug),
    getRelated(slug),
  ]);
  if (!product) notFound();

  const inStock = product.variants.some((v) => v.stock > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: product.brand },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PromoTicker />
      <Navbar />
      <main>
        <ProductView product={product} />
        <ProductSection
          title="Pairs"
          accent="Well With"
          href={product.category ? `/category/${product.category.slug}` : "/"}
          products={related}
        />
        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            image: product.images[0]?.url ?? null,
            price: product.price,
            mrp: product.mrp,
          }}
        />
      </main>
      <Footer />
    </>
  );
}
