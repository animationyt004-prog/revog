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

export const HERO_SLIDES: HeroSlide[] = [];
