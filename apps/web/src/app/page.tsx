import { BrandStory } from "@/components/home/brand-story";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { ProductSection } from "@/components/home/product-section";
import { ShopByFabric } from "@/components/home/shop-by-fabric";
import { ShopByOccasion } from "@/components/home/shop-by-occasion";
import { Testimonials } from "@/components/home/testimonials";
import { TrustStrip } from "@/components/home/trust-strip";
import { WhyHyraluxe } from "@/components/home/why-hyraluxe";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories, getProducts, getTestimonials } from "@/lib/api";
import {
  BUSINESS,
  merchantReturnPolicyLd,
  organizationLd,
} from "@/lib/business";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Organization + WebSite graph. WebSite's SearchAction enables Google's
// sitelinks search box; Organization and OnlineStore power brand/shop signals.
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${SITE_URL}/#organization`,
      ...organizationLd(),
      name: SITE_NAME,
      url: SITE_URL,
      // Google uses this for the brand logo in search results / knowledge panel.
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
      description:
        "HyraLuxe - Indian fashion online. Kurtis, kurtas, sarees, t-shirts & shirts with COD & easy 7-day returns.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: BUSINESS.email,
        telephone: `+${BUSINESS.phone}`,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
    {
      "@type": "OnlineStore",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME,
      url: SITE_URL,
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      areaServed: "IN",
      paymentAccepted: ["Cash on Delivery", "UPI", "Cards"],
      currenciesAccepted: "INR",
      hasMerchantReturnPolicy: merchantReturnPolicyLd,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage() {
  const [newDrops, bestSellers, trending, categories, testimonials] =
    await Promise.all([
      getProducts({ collection: "new", take: 8 }),
      getProducts({ collection: "bestsellers", take: 8 }),
      getProducts({ collection: "trending", take: 4 }),
      getCategories(),
      getTestimonials(6),
    ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
      />
      <PromoTicker />
      <Navbar />
      <main>
        <Hero products={newDrops} />
        <TrustStrip />
        <CategoryTiles
          categories={categories}
          products={[...newDrops, ...bestSellers, ...trending]}
        />
        <ProductSection
          title="New"
          accent="Arrivals"
          href="/collections/new-arrivals"
          products={newDrops}
          layout="rail"
          inStockOnly
        />
        <ProductSection
          title="Best"
          accent="Sellers"
          href="/collections/bestsellers"
          products={bestSellers}
          tone="soft"
        />
        <ProductSection
          title="Trending"
          accent="Now"
          href="/collections/trending"
          products={trending}
        />
        {/* Occasion row after the product rails: someone who has not been
            caught by a specific saree still knows what event they are
            shopping for, so give them that door before the brand copy. */}
        <ShopByOccasion
          products={[...newDrops, ...bestSellers, ...trending]}
        />
        {/* Fabric row after occasions: the shopper who knows the drape before
            the event. Tiles come from the same loaded products, so a fabric
            with nothing in stock never gets a door. */}
        <ShopByFabric
          products={[...newDrops, ...bestSellers, ...trending]}
        />
        {/* Reasons before story: the shopper who has scrolled this far is
            weighing up the order, so answer "why here" while they are still
            deciding, not after the brand essay. */}
        <WhyHyraluxe />
        {/* Story before social proof: say who we are, then let customers
            back it up. The other way round the reviews arrive unearned. */}
        <BrandStory />
        <Testimonials reviews={testimonials} />
        {/* The one quiet ask, placed after the story and reviews have earned
            it. Shares the popup's subscribe endpoint, so signups land in one
            place. */}
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
