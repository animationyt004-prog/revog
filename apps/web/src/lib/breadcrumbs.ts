import { SITE_URL } from "./site";

/** Breadcrumb JSON-LD. Google reads these to understand where a page sits in
 *  the site, which is one of the inputs to whether a listing gets sitelinks —
 *  the extra sub-page links under a brand's top search result. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...trail.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: `${SITE_URL}${c.path}`,
      })),
    ],
  };
}
