import Link from "next/link";
import { COLLECTIONS, stockedCollectionSlugs } from "@/lib/collections";
import { Wordmark } from "./wordmark";

interface Column {
  heading: string;
  links: { label: string; href: string }[];
}

/** Collections the shop columns draw from, in the order they should appear.
 *  Whichever of these hold stock get listed — the footer used to hard-code
 *  all eight and sent shoppers to landing pages holding nothing. */
const SHOP_ORDER = ["new-arrivals", "bestsellers", "trending", "limited"];
const EDIT_ORDER = [
  "georgette-sarees",
  "cotton-sarees",
  "party-wear-sarees",
  "festive-sarees",
  "daily-wear-sarees",
  "office-wear-sarees",
];

const STATIC_COLUMNS: Column[] = [
  {
    heading: "Help",
    links: [
      { label: "Track Order", href: "/account/orders" },
      { label: "Returns & Refunds", href: "/policies/returns" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About HyraLuxe", href: "/about" },
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Terms of Service", href: "/policies/terms" },
      { label: "Shipping Policy", href: "/policies/shipping" },
    ],
  },
];

function collectionLinks(slugs: string[], stocked: Set<string>, limit = 4) {
  return slugs
    .filter((slug) => stocked.has(slug))
    .slice(0, limit)
    .map((slug) => ({
      label: `${COLLECTIONS[slug].title} ${COLLECTIONS[slug].accent}`.trim(),
      href: `/collections/${slug}`,
    }));
}

export async function Footer() {
  const stocked = new Set(await stockedCollectionSlugs());
  const shop = collectionLinks(SHOP_ORDER, stocked);
  const edit = collectionLinks(EDIT_ORDER, stocked);

  const COLUMNS: Column[] = [
    ...(shop.length ? [{ heading: "Shop", links: shop }] : []),
    ...(edit.length ? [{ heading: "The Edit", links: edit }] : []),
    ...STATIC_COLUMNS,
  ];

  return (
    <footer className="mt-auto bg-night text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="lg" tone="dark" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              Indian fashion for every day — ethnic and casual, curated in India
              with honest pricing and delivery across the country.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/65 transition-colors hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/12 pt-6 text-xs text-white/55 sm:flex-row">
          <p>© {new Date().getFullYear()} HyraLuxe. All rights reserved.</p>
          <p>
            Made in India <span aria-hidden>🇮🇳</span> · COD & UPI accepted
          </p>
        </div>
      </div>
    </footer>
  );
}
