/**
 * Long-form, unique SEO copy per category, rendered below the product grid so
 * category pages aren't thin. Keyword-aware but written to read naturally.
 * Add a slug here to give that category a content block + richer metadata;
 * slugs without an entry simply render no extra content.
 */
export interface CategorySeo {
  /** <title> override, e.g. "Buy Sarees Online …". */
  metaTitle: string;
  /** <meta description>, ≤160 chars. */
  metaDescription: string;
  /** H2 shown above the copy. */
  heading: string;
  /** Body paragraphs. */
  paragraphs: string[];
  /** Optional FAQ (also good for rich snippets later). */
  faqs?: { q: string; a: string }[];
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  sarees: {
    metaTitle: "Buy Sarees Online – Silk, Organza & Georgette",
    metaDescription:
      "Shop printed silk, organza and georgette sarees online at REVOG. Lightweight festive & party-wear sarees with blouse piece, COD and easy 7-day returns.",
    heading: "Buy Sarees Online in India",
    paragraphs: [
      "Discover REVOG's edit of printed sarees made for real life — soft to drape, easy to carry, and ready for everything from a weekday puja to a wedding reception. Every saree in this collection is chosen for its fall, finish and colour, and each one arrives with a matching unstitched blouse piece so you can style it your way.",
      "The range covers the fabrics women reach for again and again. Bhagalpuri silk sarees bring a smooth, premium drape without the weight, ideal for festivals and family gatherings. Organza sarees offer a crisp, airy structure that photographs beautifully at daytime functions. Flowing georgette sarees carry a subtle sheen that comes alive under evening light, while satin sarees add a glossy, fluid finish for a dressed-up look.",
      "Not sure where to start? For office festivities and daytime events, a printed organza or a muted Bhagalpuri silk keeps things refined. For sangeets, receptions and parties, a wine georgette or a richly printed silk makes an easy statement. Deep navy and royal blue sarees are the safe, flattering pick when you want something classic that works across occasions.",
      "Shopping with REVOG is simple: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if a saree isn't right for you. New designs are added regularly, so bookmark this page and check back before your next occasion.",
    ],
    faqs: [
      {
        q: "Do these sarees come with a blouse piece?",
        a: "Yes. Every saree in this collection includes a matching unstitched blouse piece that you can get tailored to your fit.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Cash on Delivery is available across serviceable pincodes in India. You can check your pincode at checkout.",
      },
      {
        q: "What if the saree doesn't suit me?",
        a: "We offer easy 7-day returns. If the saree isn't right, you can raise a return from your order and we'll help you sort it out.",
      },
    ],
  },
  women: {
    metaTitle: "Women's Ethnic Wear Online – Sarees & More",
    metaDescription:
      "Shop women's ethnic fashion at REVOG — printed silk, organza and georgette sarees with blouse piece. Lightweight, festive-ready, COD and 7-day returns.",
    heading: "Women's Ethnic Fashion at REVOG",
    paragraphs: [
      "REVOG's women's edit is built around pieces that feel special without being complicated to wear. Right now the collection leads with sarees — printed silk, organza, georgette and satin — each picked for an easy drape and a finish that looks far more premium than it feels to carry.",
      "The idea is simple: festive-ready ethnic wear that suits Indian occasions and Indian weather. Lightweight fabrics that don't weigh you down through a long function, colours that flatter across skin tones, and prints that stay classic instead of going out of style after one season. Every saree ships with a matching unstitched blouse piece so you can tailor it to your fit.",
      "Whether you're dressing for a puja, a sangeet, an office celebration or a wedding reception, you'll find something here that works — with Cash on Delivery, easy 7-day returns and fresh designs added regularly. Explore the saree collection below to get started.",
    ],
  },
};

export function getCategorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO[slug];
}
