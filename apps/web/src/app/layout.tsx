import type { Metadata } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { MetaPixel } from "@/components/meta-pixel";
import { GoogleAds } from "@/components/google-ads";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { WelcomePopup } from "@/components/welcome-popup";
import "./globals.css";

/**
 * These two were stubs: plain objects whose `variable` was a Tailwind
 * arbitrary-property class pinning the tokens to Georgia and system-ui. The
 * comment claimed Playfair swapped in; nothing was ever downloaded. A saree
 * shop rendered in the OS default reads as a template, so both faces are now
 * really loaded.
 *
 * next/font self-hosts at build time — the browser makes no request to Google,
 * which keeps the fonts out of the privacy story and off the critical path.
 */
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  // No `weight`: Playfair Display is variable, so the whole 400-900 axis
  // comes in one file. A range string ("500 800") is rejected by this
  // loader — it takes discrete weights, an array, or nothing.
  //
  // Italic is loaded on purpose, for one glyph: the ampersand. Playfair's
  // italic "&" is the ornate one, and headings like "Returns & Refunds" are
  // where it earns its keep (see .amp in globals.css). Without this the
  // browser would synthesise a slanted roman "&", which looks worse than
  // leaving it upright. It is a second file, but it loads in parallel under
  // `swap` and the LCP headline itself is roman, so it does not gate paint.
  style: ["normal", "italic"],
  // The hero headline is the LCP element. "swap" paints it in the fallback
  // serif immediately rather than holding the page for the download.
  display: "swap",
});

/** Geometric sans for body copy — carries the editorial tone better than the
 *  OS default, and pairs with the Playfair headings rather than fighting them. */
const jost = Jost({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Absolute base for canonical + Open Graph URLs. Set NEXT_PUBLIC_SITE_URL to
// the custom domain once live; falls back to the deployed Render URL (never
// localhost in prod, which would poison Google's index).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hyrafashions.com";

const DESCRIPTION =
  "Buy sarees online at HyraLuxe — georgette, silk & organza sarees with blouse piece. Free shipping over ₹999, Cash on Delivery & easy 7-day returns.";

const GOOGLE_SITE_VERIFICATION = "BjBV-BzfG2mo-lE4Mh7R9bpj4XiNFcKfADXdt5zyIgc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Buy Sarees Online in India | HyraLuxe — COD & 7-Day Returns",
    template: "%s | HyraLuxe",
  },
  description: DESCRIPTION,
  applicationName: "HyraLuxe",
  // Only terms the catalogue can actually answer. Naming kurtis, kurtas,
  // t-shirts and shirts here sent shoppers to categories holding nothing,
  // which bounces them straight back to the results page.
  keywords: [
    "sarees online",
    "buy saree online india",
    "georgette saree",
    "sequin saree",
    "party wear saree",
    "saree with blouse piece",
    "lightweight saree",
    "cotton silk saree",
    "saree cash on delivery",
    "HyraLuxe",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "HyraLuxe",
    title: "Buy Sarees Online in India | HyraLuxe",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
    // Preview card shown when the link is shared (WhatsApp, Instagram, FB).
    images: [{ url: "/og-logo.png", width: 1200, height: 630, alt: "HyraLuxe" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-logo.png"],
    title: "Buy Sarees Online in India | HyraLuxe",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    // One token per Google property: the current domain (Search Console +
    // Merchant Center) and the retired Render URL, which stays verified while
    // its 301s are still passing ranking across.
    google: [
      "BjBV-BzfG2mo-lE4Mh7R9bpj4XiNFcKfADXdt5zyIgc",
      "VxR0uN_uo9CUZ8wcdK_6Uzr4YPubx9PuoUVYnks94kY",
      "3gH9_kAwGAVwfNGXwsynHuYOVi82XUntu9raIcdlK-Y",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jost.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          {/* Rendered at the root: inside the blurred sticky header,
              position:fixed would resolve against the header box. */}
          <CartDrawer />
          <WhatsAppButton />
          <WelcomePopup />
        </AuthProvider>
        <MetaPixel />
        <GoogleAds />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
