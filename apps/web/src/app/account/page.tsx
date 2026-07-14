"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  User,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { useAuth } from "@/lib/auth-store";

const TILES = [
  { icon: Package, label: "Orders", blurb: "Track, cancel, reorder", href: "/account/orders" },
  { icon: Heart, label: "Wishlist", blurb: "Saved for later", href: "/wishlist" },
  { icon: MapPin, label: "Addresses", blurb: "Delivery locations", href: "/account/addresses" },
  { icon: RotateCcw, label: "Returns", blurb: "Exchanges & refunds", href: "/account/returns" },
];

export default function AccountPage() {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status !== "authed" || !user) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Loader2 size={28} className="animate-spin text-volt" />
      </main>
    );
  }

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-volt">
                <User size={26} className="text-ink" />
              </span>
              <div>
                <h1 className="display text-3xl sm:text-4xl">
                  {user.name ?? "Street Member"}
                  <span className="text-volt">.</span>
                </h1>
                <p className="text-sm text-paper-dim">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => void logout().then(() => router.replace("/"))}
              className="flex items-center gap-2 border border-paper/25 px-4 py-2.5 text-sm transition-colors hover:border-blood hover:text-blood"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {TILES.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
              >
                <Link
                  href={t.href}
                  className="group block border border-paper/10 bg-ink-2 p-5 transition-colors hover:border-volt"
                >
                  <t.icon size={22} className="text-volt" />
                  <h2 className="display mt-3 text-xl group-hover:text-volt">{t.label}</h2>
                  <p className="mt-0.5 text-xs text-paper-dim">{t.blurb}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-xs text-paper-dim">
            Orders, addresses and returns activate as we build the next phases.
          </p>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
