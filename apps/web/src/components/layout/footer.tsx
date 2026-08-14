import Link from "next/link";
import { MetaContactLink } from "@/components/meta-contact-link";
import {
  BUSINESS,
  HAS_ADDRESS,
  formattedAddress,
  formattedPhone,
} from "@/lib/business";
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
    <footer className="mt-auto bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:gap-10">
          <div>
            <Wordmark size="lg" tone="dark" />
            <div className="mt-4 space-y-1 text-xs leading-relaxed text-white/55">
              <p>{BUSINESS.legalName ?? BUSINESS.name}</p>
              <p>
                <MetaContactLink
                  method="email"
                  href={`mailto:${BUSINESS.email}`}
                  className="hover:text-gold"
                >
                  {BUSINESS.email}
                </MetaContactLink>
                {" · "}
                <MetaContactLink
                  method="phone"
                  href={`tel:+${BUSINESS.phone}`}
                  className="hover:text-gold"
                >
                  {formattedPhone()}
                </MetaContactLink>
              </p>
              {HAS_ADDRESS ? <p>{formattedAddress()}</p> : null}
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              Indian fashion for every day — ethnic and casual, curated in India
              with honest pricing and delivery across the country.
            </p>
          </div>
          {/* Phones get two flowing columns rather than five stacked ones —
              stacking put the footer at over a screen and a half. Multi-column
              rather than a grid because the lists are uneven (Shop can hold a
              single stocked link), and a grid row leaves the short one a hole.
              `md:contents` dissolves this wrapper so the desktop grid still
              receives the columns as its own children. */}
          <div className="mt-9 columns-2 gap-x-6 md:mt-0 md:contents">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="mb-8 break-inside-avoid md:mb-0">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {col.heading}
                </h4>
                <ul className="space-y-1 md:space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {/* py-3 puts the touch area at the 44px minimum on a
                          phone; the desktop rhythm is left as it was. */}
                      <Link
                        href={l.href}
                        className="inline-block py-3 text-sm text-white/65 transition-colors hover:text-gold md:py-0"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
