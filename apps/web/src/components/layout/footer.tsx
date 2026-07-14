import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "New Drops", href: "/collections/new-arrivals" },
      { label: "Best Sellers", href: "/collections/bestsellers" },
      { label: "Trending", href: "/collections/trending" },
      { label: "Limited Edition", href: "/collections/limited" },
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
      { label: "About NO CURFEW", href: "/about" },
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Terms of Service", href: "/policies/terms" },
      { label: "Shipping Policy", href: "/policies/shipping" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-paper/10 bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="display text-3xl">
              NO&nbsp;CURFEW<span className="text-volt">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper-dim">
              Streetwear without permission. Designed and made in India, worn
              after hours everywhere.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="display mb-3 text-lg text-volt">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-paper-dim transition-colors hover:text-paper"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-paper/10 pt-6 text-xs text-paper-dim sm:flex-row">
          <p>© {new Date().getFullYear()} NO CURFEW. All rights reserved.</p>
          <p>
            Made in India <span aria-hidden>🇮🇳</span> · COD & UPI accepted
          </p>
        </div>
      </div>
    </footer>
  );
}
