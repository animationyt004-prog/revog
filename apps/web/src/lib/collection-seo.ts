export interface CollectionSeo {
  heading: string;
  paragraphs: string[];
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
}

export const COLLECTION_SEO: Record<string, CollectionSeo> = {
  "georgette-sarees": {
    heading: "Buy Georgette Sarees Online at HyraLuxe",
    paragraphs: [
      "Georgette sarees are a reliable choice when you want a fluid drape without carrying a heavy fabric through the day. The fabric falls close to the body, holds pleats neatly and moves easily, making it suitable for parties, receptions, festive dinners and wedding functions.",
      "The HyraLuxe georgette edit includes embroidered borders, sequin details and occasion-ready colours. Compare the border work, blouse-piece details, transparency and wash-care information on each product page before ordering. For a refined evening look, pair a deeper shade with a tonal blouse; for daytime events, choose softer colours and lighter jewellery.",
    ],
    faqs: [
      {
        q: "Are georgette sarees easy to drape?",
        a: "Yes. Georgette is lightweight, flexible and holds pleats well, so it is generally easier to manage than stiffer occasion fabrics.",
      },
      {
        q: "Do HyraLuxe georgette sarees include a blouse piece?",
        a: "Blouse details are listed on every product page. Check the selected saree for the included blouse-piece length and fabric before ordering.",
      },
      {
        q: "Can I order a georgette saree with Cash on Delivery?",
        a: "Cash on Delivery is available at serviceable Indian pincodes. Enter your pincode on the product page to check delivery availability.",
      },
    ],
    related: [
      { label: "Party wear sarees", href: "/collections/party-wear-sarees" },
      { label: "Festive sarees", href: "/collections/festive-sarees" },
      { label: "New arrivals", href: "/collections/new-arrivals" },
    ],
  },
  "party-wear-sarees": {
    heading: "Party Wear Sarees for Receptions & Evening Events",
    paragraphs: [
      "A good party wear saree should make an impact without becoming difficult to carry. This HyraLuxe collection brings together flowing georgette, sequin work, mirror details, embroidered borders and richer colours for receptions, birthdays, cocktail evenings and family celebrations.",
      "Choose the finish according to the event. Sequins and metallic borders work well under evening lights, while pearl details and softer colours suit engagement functions and daytime celebrations. Each listing shows the fabric, saree length, blouse details, transparency and care instructions so you can compare the complete look before buying.",
    ],
    faqs: [
      {
        q: "Which saree is best for an evening party?",
        a: "Georgette or chiffon sarees with sequin, mirror or embroidered borders are light to carry and reflect evening light well.",
      },
      {
        q: "How should I style a party wear saree?",
        a: "Let the saree detail lead. Pair heavy borders with simpler jewellery, or style a plain drape with a statement blouse and earrings.",
      },
      {
        q: "What is the HyraLuxe return window?",
        a: "Eligible unused items with tags can be returned within 7 days according to the returns policy shown on the website.",
      },
    ],
    related: [
      { label: "Georgette sarees", href: "/collections/georgette-sarees" },
      { label: "Festive sarees", href: "/collections/festive-sarees" },
      { label: "Sarees under Rs.999", href: "/collections/sarees-under-999" },
    ],
  },
  "festive-sarees": {
    heading: "Festive Sarees for Puja, Weddings & Celebrations",
    paragraphs: [
      "Festive dressing calls for colour, texture and a saree that remains comfortable through a long celebration. HyraLuxe festive sarees include zari-woven details, embroidery, embellished borders and traditional motifs suited to pujas, family functions, wedding events and festival evenings.",
      "For daytime celebrations, consider lighter colours and woven texture. Deeper jewel tones, metallic work and defined borders suit evening functions. Product pages include practical details such as fabric, blouse piece, saree length and wash care, helping you choose by more than the photograph alone.",
    ],
    faqs: [
      {
        q: "Which colours work well for festive sarees?",
        a: "Red, maroon, green, royal blue and jewel tones are classic festive choices. Pastels work especially well for daytime pujas and summer functions.",
      },
      {
        q: "Can festive sarees be worn to weddings?",
        a: "Yes. Sarees with zari, embroidery or embellished borders work well for wedding functions; choose the level of detail according to the event.",
      },
      {
        q: "How should festive sarees be cleaned?",
        a: "Follow the wash-care instructions on the individual product page. Embellished and zari sarees commonly require dry cleaning.",
      },
    ],
    related: [
      { label: "Party wear sarees", href: "/collections/party-wear-sarees" },
      { label: "Georgette sarees", href: "/collections/georgette-sarees" },
      { label: "New arrivals", href: "/collections/new-arrivals" },
    ],
  },
  "sarees-under-999": {
    heading: "Shop Sarees Under Rs.999 Online",
    paragraphs: [
      "The HyraLuxe sarees-under-Rs.999 edit is for shoppers who want an occasion-ready look at a clear budget. The collection may include daily, festive and lightweight party styles, with every listed saree priced at Rs.999 or below when the page is loaded.",
      "Price is only one part of the decision. Use the product page to compare fabric, border work, blouse details, transparency and current stock. Prices and availability can change as styles sell out or promotions end, so the amount displayed on the product and checkout pages is the final applicable price.",
    ],
    faqs: [
      {
        q: "Are all sarees on this page below Rs.999?",
        a: "Yes. This collection is filtered to show sarees priced at Rs.999 or below at the time the page is loaded.",
      },
      {
        q: "Is Cash on Delivery available on sarees under Rs.999?",
        a: "Cash on Delivery depends on the delivery pincode. Check availability on the product page before placing the order.",
      },
      {
        q: "Does a lower price change the return policy?",
        a: "No. Eligible unused products with tags follow the same 7-day return policy unless a product page clearly states otherwise.",
      },
    ],
    related: [
      { label: "Cotton sarees", href: "/collections/cotton-sarees" },
      { label: "Party wear sarees", href: "/collections/party-wear-sarees" },
      { label: "New arrivals", href: "/collections/new-arrivals" },
    ],
  },
  "cotton-sarees": {
    heading: "Cotton & Cotton-Blend Sarees for Comfortable Wear",
    paragraphs: [
      "Cotton and cotton-blend sarees are made for days when comfort matters as much as appearance. Their breathable feel and structured drape suit office days, daytime functions, pujas and repeat wear. Cotton tissue adds a festive sheen, while softer cotton blends are easier for long hours.",
      "Review the exact fabric composition on each HyraLuxe product page because cotton silk, cotton tissue and pure cotton behave differently. A light starch can create sharper pleats in softer cotton, while woven or tissue styles are best cared for according to their individual wash instructions.",
    ],
    faqs: [
      {
        q: "Are cotton sarees suitable for office wear?",
        a: "Yes. Their breathable fabric and neat structure make cotton and softer cotton blends practical for long office days.",
      },
      {
        q: "What is the difference between cotton tissue and soft cotton?",
        a: "Cotton tissue has more sheen and structure for festive wear, while soft cotton generally feels lighter and more relaxed for daily use.",
      },
      {
        q: "Do cotton sarees need dry cleaning?",
        a: "Care varies by weave and embellishment. Always follow the wash-care instructions on the selected product page.",
      },
    ],
    related: [
      { label: "Georgette sarees", href: "/collections/georgette-sarees" },
      { label: "Sarees under Rs.999", href: "/collections/sarees-under-999" },
      { label: "Festive sarees", href: "/collections/festive-sarees" },
    ],
  },
  "daily-wear-sarees": {
    heading: "Lightweight Daily Wear Sarees for Women",
    paragraphs: [
      "Daily wear sarees should be easy to pleat, comfortable through long hours and simple to repeat with different blouses. This HyraLuxe edit focuses on manageable drapes and versatile colours for home, errands, casual gatherings and regular daytime wear.",
      "Look beyond colour when choosing. Fabric weight, transparency, border width and wash care affect how practical a saree feels every week. Those details are listed on each product page, along with blouse information and delivery availability.",
    ],
    faqs: [
      {
        q: "Which saree fabrics are comfortable for daily wear?",
        a: "Cotton, cotton blends and lighter georgette styles are popular because they are breathable or easy to manage through the day.",
      },
      {
        q: "How can I make a daily wear saree easier to drape?",
        a: "Choose a lightweight fabric, prepare the pleats before wearing and use two or three secure saree pins without pulling the fabric.",
      },
      {
        q: "Does HyraLuxe deliver daily wear sarees across India?",
        a: "HyraLuxe ships to serviceable pincodes across India. Use the pincode checker on a product page for availability.",
      },
    ],
    related: [
      { label: "Cotton sarees", href: "/collections/cotton-sarees" },
      { label: "Office wear sarees", href: "/collections/office-wear-sarees" },
      { label: "Sarees under Rs.999", href: "/collections/sarees-under-999" },
    ],
  },
  "office-wear-sarees": {
    heading: "Elegant Office Wear Sarees for Work",
    paragraphs: [
      "Office wear sarees work best when the drape is comfortable, the border stays refined and the colour remains easy to repeat. HyraLuxe office styles are selected for workdays, formal meetings, office celebrations and professional events where a polished look matters.",
      "Muted colours, smaller prints and lightweight fabrics are versatile for regular workwear. For office festivals or presentations, a defined border or subtle sheen adds occasion detail without making the saree difficult to carry. Check fabric, transparency and blouse details on each listing before choosing.",
    ],
    faqs: [
      {
        q: "Which saree is best for office wear?",
        a: "Lightweight cotton blends, soft georgette and sarees with smaller prints or understated borders are practical for work.",
      },
      {
        q: "What colours are suitable for office sarees?",
        a: "Navy, grey, green, wine and muted pastels are easy professional choices. Keep the blouse and accessories simple for regular workdays.",
      },
      {
        q: "Can I return an office wear saree if it does not suit me?",
        a: "Eligible unused items with tags can be returned within 7 days according to the HyraLuxe returns policy.",
      },
    ],
    related: [
      { label: "Daily wear sarees", href: "/collections/daily-wear-sarees" },
      { label: "Cotton sarees", href: "/collections/cotton-sarees" },
      { label: "Georgette sarees", href: "/collections/georgette-sarees" },
    ],
  },
};

export function getCollectionSeo(slug: string): CollectionSeo | undefined {
  return COLLECTION_SEO[slug];
}
