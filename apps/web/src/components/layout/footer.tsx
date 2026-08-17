import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { MetaContactLink } from "@/components/meta-contact-link";
import {
  BUSINESS,
  HAS_ADDRESS,
  formattedAddress,
  formattedPhone,
  HAS_WHATSAPP,
  socialProfiles,
  whatsappLink,
} from "@/lib/business";
import { amp } from "@/components/typography";
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

/** Brand marks are drawn inline because lucide dropped its brand icon set -
 *  importing them from there fails to compile. Same approach as the floating
 *  WhatsApp button, which has always carried its own path. */
const iconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const SOCIAL_ICONS = {
  instagram: () => (
    <svg {...iconProps}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: () => (
    <svg {...iconProps}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  youtube: () => (
    <svg {...iconProps}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  ),
} as const;

/** What Razorpay's checkout actually offers plus COD, which the API settles
 *  separately. Listed as words rather than card-network logos: the logos are
 *  trademarked artwork we would have to be licensed to display, and a wrong
 *  one on a payment row reads as a fake storefront. */
const PAYMENT_METHODS = [
  "Cash on Delivery",
  "UPI",
  "Visa",
  "Mastercard",
  "RuPay",
  "Net Banking",
];

const STATIC_COLUMNS: Column[] = [
  {
    heading: "Help",
    links: [
      { label: "Track Order", href: "/account/orders" },
      { label: "FAQs", href: "/faq" },
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
      { label: "Cancellation Policy", href: "/policies/cancellation" },
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
            <Wordmark size="lg" tone="dark" parent />
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
            {/* WhatsApp is unconditional because it is built from the support
                number, which is real. The rest appear only once their handles
                are configured, so the row never ships a dead profile link. */}
            <ul className="mt-5 flex items-center gap-2">
              {HAS_WHATSAPP ? (
                <li>
                  <MetaContactLink
                    method="whatsapp"
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with HyraLuxe on WhatsApp"
                    className="grid h-11 w-11 place-items-center border border-white/15 text-white/70 transition-colors hover:border-gold hover:text-gold"
                  >
                    <MessageCircle size={17} aria-hidden />
                  </MetaContactLink>
                </li>
              ) : null}
              {socialProfiles().map((profile) => {
                const Icon = SOCIAL_ICONS[profile.key];
                return (
                  <li key={profile.key}>
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`HyraLuxe on ${profile.label}`}
                      className="grid h-11 w-11 place-items-center border border-white/15 text-white/70 transition-colors hover:border-gold hover:text-gold"
                    >
                      <Icon />
                    </a>
                  </li>
                );
              })}
            </ul>
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
                        {amp(l.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-white/12 pt-6">
          <ul className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="border border-white/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/55"
              >
                {method}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/45">
            Online payments secured by Razorpay. Card details are never stored
            on our servers.
          </p>
          <div className="mt-5 flex flex-col items-start justify-between gap-2 text-xs text-white/55 sm:flex-row">
            <p>© {new Date().getFullYear()} HyraLuxe. All rights reserved.</p>
            <p>
              Made in India <span aria-hidden>🇮🇳</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
