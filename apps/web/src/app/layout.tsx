import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { MetaPixel } from "@/components/meta-pixel";
import { GoogleAds } from "@/components/google-ads";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { WelcomePopup } from "@/components/welcome-popup";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  // Elegant serif for headings — the fashion/ethnic display face. "swap" so
  // the LCP hero text paints immediately with a serif fallback, then Playfair
  // swaps in without blocking render.
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Absolute base for canonical + Open Graph URLs. Set NEXT_PUBLIC_SITE_URL to
// the custom domain once live; falls back to the deployed Render URL (never
// localhost in prod, which would poison Google's index).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hyrafashions.com";

const DESCRIPTION =
  "Shop Indian fashion at Hyra Fashion — kurtis, kurtas, sarees, t-shirts and shirts. Free shipping over ₹999, Cash on Delivery and easy 7-day returns.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hyra Fashion — Kurtis, Sarees, T-Shirts & Shirts Online in India",
    template: "%s | Hyra Fashion",
  },
  description: DESCRIPTION,
  applicationName: "Hyra Fashion",
  keywords: [
    "indian fashion online",
    "kurti online",
    "kurta online",
    "kurti set",
    "sarees online",
    "silk saree",
    "organza saree",
    "t shirt online",
    "oversized t shirt",
    "shirts online",
    "hyra fashion",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Hyra Fashion",
    title: "Hyra Fashion — Indian Fashion Online",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyra Fashion — Indian Fashion Online",
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
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
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
