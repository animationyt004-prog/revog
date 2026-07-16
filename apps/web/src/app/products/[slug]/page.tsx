import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { ProductSection } from "@/components/home/product-section";
import { ProductView } from "@/components/product/product-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ReviewsSection } from "@/components/product/reviews-section";
import { getProduct, getRelated } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not Found" };
  const desc = product.description.slice(0, 155);
  return {
    title: product.name,
    description: desc,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | REVOG`,
      description: desc,
      url: `${SITE_URL}/products/${slug}`,
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: product.images[0] ? [product.images[0].url] : [],
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
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku ?? product.slug,
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
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  // Breadcrumb trail → Google shows "Home › Category › Product" in results.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${SITE_URL}/category/${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PromoTicker />
      <Navbar />
      <main>
        <ProductView product={product} />
        <ReviewsSection slug={product.slug} />
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
