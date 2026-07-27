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
  "oversized-tees": {
    metaTitle: "Oversized T-Shirts Online – Heavyweight Cotton Tees",
    metaDescription:
      "Shop oversized t-shirts at Hyra Fashion — heavyweight cotton, drop-shoulder fits that hold shape after washes. COD and easy 7-day returns.",
    heading: "Oversized T-Shirts Online",
    paragraphs: [
      "An oversized tee only works if the fabric can carry the shape. Ours are cut from heavyweight cotton with a drop shoulder and a boxy body, so the tee falls cleanly instead of clinging — and stays that way after repeated washes rather than stretching at the neck within a month.",
      "The fits are relaxed but not shapeless: room through the chest and sleeve, a length that sits right at the hip, and ribbed collars that keep their shape. Pre-shrunk and bio-washed, so what you try on the first day is what you get months later.",
      "These work as the easiest layer you own — on their own in summer, under an overshirt or jacket when it cools down. Sizes run generous by design, so if you want a regular fit rather than a roomy one, take the smaller size; our size guide has the flat measurements for every size.",
      "Shopping with Hyra Fashion is simple: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if the fit isn't right.",
    ],
    faqs: [
      {
        q: "How should I pick a size in an oversized tee?",
        a: "Our tees are cut generously. For a regular fit take the smaller size; for a roomier look take the larger one. The size guide lists flat chest, length and shoulder measurements for every size.",
      },
      {
        q: "Will the fabric shrink or lose shape?",
        a: "The cotton is pre-shrunk and bio-washed, and the collars are ribbed to hold their shape. Wash cold and dry in shade to keep them at their best.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, across serviceable pincodes in India. You can check your pincode on any product page.",
      },
    ],
  },
  sarees: {
    metaTitle: "Buy Sarees Online – Silk, Organza & Georgette",
    metaDescription:
      "Shop printed silk, organza and georgette sarees online at Hyra Fashion. Lightweight festive & party-wear sarees with blouse piece, COD and easy 7-day returns.",
    heading: "Buy Sarees Online in India",
    paragraphs: [
      "Discover Hyra Fashion's edit of printed sarees made for real life — soft to drape, easy to carry, and ready for everything from a weekday puja to a wedding reception. Every saree in this collection is chosen for its fall, finish and colour, and each one arrives with a matching unstitched blouse piece so you can style it your way.",
      "The range covers the fabrics women reach for again and again. Bhagalpuri silk sarees bring a smooth, premium drape without the weight, ideal for festivals and family gatherings. Organza sarees offer a crisp, airy structure that photographs beautifully at daytime functions. Flowing georgette sarees carry a subtle sheen that comes alive under evening light, while satin sarees add a glossy, fluid finish for a dressed-up look.",
      "Not sure where to start? For office festivities and daytime events, a printed organza or a muted Bhagalpuri silk keeps things refined. For sangeets, receptions and parties, a wine georgette or a richly printed silk makes an easy statement. Deep navy and royal blue sarees are the safe, flattering pick when you want something classic that works across occasions.",
      "Shopping with Hyra Fashion is simple: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if a saree isn't right for you. New designs are added regularly, so bookmark this page and check back before your next occasion.",
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
  kurtis: {
    metaTitle: "Kurtis Online – Cotton, Rayon & Festive Kurtis for Women",
    metaDescription:
      "Buy kurtis online at Hyra Fashion — everyday cotton kurtis, office wear and festive styles in easy fits. Cash on Delivery and easy 7-day returns.",
    heading: "Kurtis Online for Every Day and Every Occasion",
    paragraphs: [
      "A good kurti earns its place by working everywhere — over jeans on a workday, with a palazzo at a family lunch, dressed up with jhumkas for a festival evening. Hyra Fashion's kurti edit is picked with exactly that range in mind: breathable fabrics, prints that stay classic, and cuts that flatter without needing constant adjusting.",
      "Expect straight-cut and A-line silhouettes in cotton and rayon for daily wear, alongside embroidered and printed styles for occasions. Lengths and sleeves are chosen for Indian weather and real routines — pieces you can wear through a full day and still feel put together.",
      "If you're between sizes, check the flat measurements in our size guide before ordering; kurtis are listed with chest and length measurements for every size, so the fit you picture is the fit that arrives.",
      "As always with Hyra Fashion: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if a kurti isn't right for you. New styles are added regularly, so check back before your next occasion.",
    ],
    faqs: [
      {
        q: "Which kurti fabric is best for daily wear?",
        a: "Cotton and rayon are the most comfortable for all-day wear in Indian weather — breathable, soft and easy to maintain. Save embroidered and heavier festive styles for occasions.",
      },
      {
        q: "How do I pick the right kurti size?",
        a: "Every kurti lists flat chest and length measurements in the size guide. Compare them with a kurti you already own for the most reliable fit.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, Cash on Delivery is available across serviceable pincodes in India, with easy 7-day returns if the fit isn't right.",
      },
    ],
  },
  "suit-sets": {
    metaTitle: "Suit Sets for Women Online – Ready-to-Wear Co-ord Sets",
    metaDescription:
      "Shop women's suit sets online at Hyra Fashion — ready-to-wear kurta, bottom and dupatta sets for work and festive days. COD and easy 7-day returns.",
    heading: "Ready-to-Wear Suit Sets for Women",
    paragraphs: [
      "A suit set solves the hardest part of ethnic dressing: making everything match. Each set in this collection arrives coordinated and ready to wear — kurta, bottom and dupatta cut from matching or deliberately paired fabrics, so the whole outfit works the moment you put it on.",
      "The edit spans everyday cotton sets you can wear to work or errands, and festive sets with richer prints and finishes for pujas, family functions and celebrations. No tailoring rounds, no hunting for a dupatta that goes — just one decision instead of three.",
      "Sizes follow our standard size guide with flat measurements listed for every piece, and the fabrics are picked to carry you through long days comfortably in Indian weather.",
      "Shopping with Hyra Fashion stays simple: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if a set doesn't suit you.",
    ],
    faqs: [
      {
        q: "What comes included in a suit set?",
        a: "Each listing specifies its pieces — typically a kurta and bottom, with a dupatta where shown in the photos. Everything arrives stitched and ready to wear.",
      },
      {
        q: "Are suit sets good for daily wear or only occasions?",
        a: "Both. Cotton sets in lighter prints work for office and daily wear, while richer printed and embellished sets are made for festive days.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, across serviceable pincodes in India, with easy 7-day returns if the fit or style isn't right.",
      },
    ],
  },
  kurtas: {
    metaTitle: "Men's Kurtas Online – Cotton & Festive Kurtas",
    metaDescription:
      "Buy men's kurtas online at Hyra Fashion — classic cotton kurtas for daily wear and festive styles for occasions. Cash on Delivery and easy 7-day returns.",
    heading: "Men's Kurtas for Daily Wear and Festive Days",
    paragraphs: [
      "A well-cut kurta is the easiest thing a man can wear well. Hyra Fashion's kurta edit keeps it classic: clean collars, honest fabrics and lengths that sit right — pieces that look intentional at a puja, a wedding function or a Sunday at home.",
      "Cotton kurtas anchor the range for daily and summer wear — breathable, soft and easy to maintain. For occasions, richer fabrics and deeper tones step in; pair them with churidar, pyjama or even jeans for a relaxed festive look.",
      "Fits are regular through the chest with room to move, and every listing carries flat measurements in the size guide — compare with a kurta you own and the size you pick is the size that fits.",
      "As with everything at Hyra Fashion: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if the kurta isn't right.",
    ],
    faqs: [
      {
        q: "What do I wear with a kurta?",
        a: "Churidar or pyjama for a traditional look, jeans for a casual one. Neutral footwear — kolhapuris, loafers or clean sneakers — works with almost every kurta.",
      },
      {
        q: "Which kurta fabric should I pick?",
        a: "Cotton for daily and summer wear; richer blends and deeper colours for weddings and festive evenings.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, Cash on Delivery is available across serviceable pincodes in India, with easy 7-day returns.",
      },
    ],
  },
  "kurta-sets": {
    metaTitle: "Men's Kurta Sets Online – Wedding & Festive Sets",
    metaDescription:
      "Shop men's kurta sets online at Hyra Fashion — coordinated kurta and bottom sets for weddings, festivals and pujas. COD and easy 7-day returns.",
    heading: "Men's Kurta Sets for Weddings and Festivals",
    paragraphs: [
      "For the days that matter — weddings, festivals, pujas — a kurta set takes the guesswork out of dressing up. Each set pairs a kurta with its matching bottom, cut to work together, so the outfit is done the moment it arrives.",
      "The collection leans festive: refined fabrics, wedding-friendly tones and details that photograph well without shouting. Throw on a Nehru jacket and the same set moves from a family function to a reception.",
      "Fits are regular with room to sit, eat and dance in comfort, and flat measurements for both pieces are listed in the size guide so the whole set fits the way you expect.",
      "Hyra Fashion keeps the rest simple: transparent pricing, Cash on Delivery across serviceable pincodes, and easy 7-day returns if the set isn't right for the occasion.",
    ],
    faqs: [
      {
        q: "What's included in a kurta set?",
        a: "A kurta and its matching bottom, stitched and ready to wear. Each listing's photos and description confirm the exact pieces.",
      },
      {
        q: "Can I wear a kurta set to a wedding?",
        a: "Yes — that's what they're made for. Add a Nehru jacket or a stole to dress the same set up further for receptions and sangeets.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, across serviceable pincodes in India, with easy 7-day returns if the fit isn't right.",
      },
    ],
  },
  women: {
    metaTitle: "Women's Ethnic Wear Online – Sarees & More",
    metaDescription:
      "Shop women's ethnic fashion at Hyra Fashion — printed silk, organza and georgette sarees with blouse piece. Lightweight, festive-ready, COD and 7-day returns.",
    heading: "Women's Ethnic Fashion at Hyra Fashion",
    paragraphs: [
      "Hyra Fashion's women's edit is built around pieces that feel special without being complicated to wear. Right now the collection leads with sarees — printed silk, organza, georgette and satin — each picked for an easy drape and a finish that looks far more premium than it feels to carry.",
      "The idea is simple: festive-ready ethnic wear that suits Indian occasions and Indian weather. Lightweight fabrics that don't weigh you down through a long function, colours that flatter across skin tones, and prints that stay classic instead of going out of style after one season. Every saree ships with a matching unstitched blouse piece so you can tailor it to your fit.",
      "Whether you're dressing for a puja, a sangeet, an office celebration or a wedding reception, you'll find something here that works — with Cash on Delivery, easy 7-day returns and fresh designs added regularly. Explore the saree collection below to get started.",
    ],
  },
};

export function getCategorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO[slug];
}
