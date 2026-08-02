import Link from "next/link";
import { Wordmark } from "./wordmark";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "New In", href: "/collections/new-arrivals" },
      { label: "Best Sellers", href: "/collections/bestsellers" },
      { label: "Trending", href: "/collections/trending" },
      { label: "Limited Edition", href: "/collections/limited" },
    ],
  },
  {
    heading: "Trending",
    links: [
      { label: "Georgette Sarees", href: "/collections/georgette-sarees" },
      { label: "Party Wear Sarees", href: "/collections/party-wear-sarees" },
      { label: "Daily Wear Sarees", href: "/collections/daily-wear-sarees" },
      { label: "Office Wear Sarees", href: "/collections/office-wear-sarees" },
    ],
  },
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
      { label: "About Hyra Fashion", href: "/about" },
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Terms of Service", href: "/policies/terms" },
      { label: "Shipping Policy", href: "/policies/shipping" },
    ],
  },
];

export function Footer() {
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
          <p>© {new Date().getFullYear()} Hyra Fashion. All rights reserved.</p>
          <p>
            Made in India <span aria-hidden>🇮🇳</span> · COD & UPI accepted
          </p>
        </div>
      </div>
    </footer>
  );
}
