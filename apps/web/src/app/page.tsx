import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/product-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { getCategories, getProducts } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Organization + WebSite graph. WebSite's SearchAction enables Google's
// sitelinks search box; Organization and OnlineStore power brand/shop signals.
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
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
        "Hyra Fashion - Indian fashion online. Kurtis, kurtas, sarees, t-shirts and shirts with COD and easy 7-day returns.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
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
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
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
  const [newDrops, bestSellers, trending, categories] = await Promise.all([
    getProducts({ collection: "new", take: 8 }),
    getProducts({ collection: "bestsellers", take: 8 }),
    getProducts({ collection: "trending", take: 4 }),
    getCategories(),
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
        <ProductSection
          title="New"
          accent="Arrivals"
          href="/collections/new-arrivals"
          products={newDrops}
          layout="rail"
        />
        <CategoryTiles categories={categories} />
        <ProductSection
          title="Best"
          accent="Sellers"
          href="/collections/bestsellers"
          products={bestSellers}
        />
        <ProductSection
          title="Trending"
          accent="Now"
          href="/collections/trending"
          products={trending}
        />
      </main>
      <Footer />
    </>
  );
}
