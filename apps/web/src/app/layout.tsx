import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "REVOG — Streetwear Without Permission",
    template: "%s | REVOG",
  },
  description:
    "Oversized tees, heavyweight hoodies, cargos and joggers. Indian streetwear built for after hours. Free shipping over ₹999. COD available.",
  keywords: [
    "streetwear",
    "oversized t-shirts",
    "hoodies",
    "cargo pants",
    "indian streetwear",
    "no curfew",
  ],
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
