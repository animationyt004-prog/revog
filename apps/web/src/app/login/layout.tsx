import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in securely to track HyraLuxe orders, returns and account details.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
