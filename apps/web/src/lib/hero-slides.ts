/**
 * Editorial hero slides.
 *
 * Leave this empty and the banner falls back to catalogue photography — the
 * first few products with images, under one shared headline. Fill it in and
 * each slide carries its own artwork and its own copy.
 *
 * `image` must be a URL the site is allowed to load: anything under the R2
 * bucket in next.config's remotePatterns. The admin product uploader puts
 * files there, so a shot uploaded through it can be pasted straight in.
 */
export interface HeroSlide {
  /** Full-bleed backdrop. Shoot or crop landscape — it fills a 480px band. */
  image: string;
  /** Small tracked line above the headline. */
  eyebrow: string;
  /** First headline line, set in the serif. */
  title: string;
  /** Second line, picked out in gold. */
  accent: string;
  /** One sentence under the rule. */
  subtitle: string;
  /** Button label and destination. */
  ctaLabel: string;
  ctaHref: string;
}

/**
 * Slide one is dated: Raksha Bandhan comes and goes, and a banner still
 * selling it in September reads as an abandoned shop. Drop that entry once
 * the festival passes — the rest carry no date and can stay.
 *
 * Every image here is a catalogue shot that has been checked by eye: a single
 * model, no supplier collage, 3:4. Several photos in the bucket are three
 * panels stitched into one file, and one of those across the full-bleed band
 * would look like a mistake. Check a replacement before pasting it in.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    image:
      "https://pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev/products/women-pearl-sequin-embellished-net-saree/baby-pink-01-main-4328f4.jpg",
    eyebrow: "RAKSHA BANDHAN",
    title: "Something soft",
    accent: "for the day.",
    subtitle:
      "Pearl-worked nets and pastel drapes, light enough to wear through a long afternoon.",
    ctaLabel: "Shop festive sarees",
    ctaHref: "/collections/festive-sarees",
  },
  {
    image:
      "https://pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev/products/women-elegant-georgette-mirror-sequin-embroidered-saree/wine-01-main-730f39.jpg",
    eyebrow: "WEDDING SEASON",
    title: "Mirror, sequin,",
    accent: "and a heavy blouse.",
    subtitle:
      "Pieces made for the sangeet and the reception, not for the back of the wardrobe.",
    ctaLabel: "Shop party wear",
    ctaHref: "/collections/party-wear-sarees",
  },
  {
    image:
      "https://pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev/products/women-zari-embroidered-georgette-saree-scalloped-border/bottle-green-01-1-505974.jpg",
    eyebrow: "ZARI & GEORGETTE",
    title: "Fine gold work",
    accent: "on a light drape.",
    subtitle:
      "Scalloped borders and zari chains on georgette that pleats without a fight.",
    ctaLabel: "Shop georgette",
    ctaHref: "/collections/georgette-sarees",
  },
  {
    image:
      "https://pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev/products/women-floral-printed-organza-saree-scalloped-border/ivory-01-13-46597f.jpg",
    eyebrow: "NEW DROPS",
    title: "Printed organza,",
    accent: "freshly landed.",
    subtitle: "The latest additions to the shelf, in this season's softer palette.",
    ctaLabel: "Shop new arrivals",
    ctaHref: "/collections/new-arrivals",
  },
];
