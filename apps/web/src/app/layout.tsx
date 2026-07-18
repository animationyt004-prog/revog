import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { MetaPixel } from "@/components/meta-pixel";
import { GoogleAds } from "@/components/google-ads";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  // Display font drives the (huge) LCP text: "optional" means first paint
  // uses the size-matched fallback with no late swap repaint — Anton kicks
  // in from cache on subsequent loads. Keeps mobile LCP fast.
  display: "optional",
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
  "Oversized tees, heavyweight hoodies, cargos and joggers. Premium Indian streetwear built for after hours. Free shipping over ₹999. Cash on Delivery available.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "REVOG — Premium Indian Streetwear | Oversized Tees & Hoodies",
    template: "%s | REVOG",
  },
  description: DESCRIPTION,
  applicationName: "REVOG",
  keywords: [
    "streetwear india",
    "oversized t-shirts",
    "oversized tshirt men",
    "drop shoulder tee",
    "hoodies for men",
    "cargo pants men",
    "joggers",
    "premium streetwear",
    "REVOG",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "REVOG",
    title: "REVOG — Premium Indian Streetwear",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "REVOG — Premium Indian Streetwear",
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
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
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
      </body>
    </html>
  );
}
