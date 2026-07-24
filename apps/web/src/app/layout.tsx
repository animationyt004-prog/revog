import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { MetaPixel } from "@/components/meta-pixel";
import { GoogleAds } from "@/components/google-ads";
import { AnalyticsTracker } from "@/components/analytics-tracker";
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revog-web.onrender.com";

const DESCRIPTION =
  "Shop festive sarees online at REVOG — printed silk, organza and georgette sarees with matching blouse piece. Free shipping over ₹999, Cash on Delivery and easy 7-day returns.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "REVOG — Buy Sarees Online in India | Silk, Organza & Georgette",
    template: "%s | REVOG",
  },
  description: DESCRIPTION,
  applicationName: "REVOG",
  keywords: [
    "sarees online",
    "buy sarees online india",
    "silk saree",
    "organza saree",
    "georgette saree",
    "bhagalpuri silk saree",
    "printed saree",
    "party wear saree",
    "festive saree",
    "REVOG",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "REVOG",
    title: "REVOG — Buy Sarees Online in India",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "REVOG — Buy Sarees Online in India",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    google: "3gH9_kAwGAVwfNGXwsynHuYOVi82XUntu9raIcdlK-Y",
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
        </AuthProvider>
        <MetaPixel />
        <GoogleAds />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
