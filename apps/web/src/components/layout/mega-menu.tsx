"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { CategoryData } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const COLLECTIONS = [
  { label: "New Drops", href: "/collections/new-arrivals", hot: true },
  { label: "Trending Now", href: "/collections/trending", hot: false },
  { label: "Limited Edition", href: "/collections/limited", hot: false },
  { label: "Best Sellers", href: "/collections/bestsellers", hot: false },
];

/** Desktop-only hover mega menu under the "Shop" nav item. */
export function MegaMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CategoryData[]) => setCategories(data))
      .catch(() => undefined);
  }, []);

  return (
    <li
      className="hidden md:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        className="flex items-center gap-1 py-5 text-sm font-medium text-paper-dim transition-colors hover:text-volt"
      >
        Shop
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full border-b border-t border-paper/10 bg-ink shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[1.2fr_1fr_1.2fr] gap-10 px-6 py-8">
              {/* Categories */}
              <div>
                <p className="display mb-3 text-sm tracking-widest text-paper-dim">
                  CATEGORIES
                </p>
                <ul className="space-y-1">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/category/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="group flex items-baseline justify-between py-1.5"
                      >
                        <span className="display text-2xl transition-colors group-hover:text-volt">
                          {c.name}
                        </span>
                        <span className="text-xs text-paper-dim">
                          {c._count.products}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collections */}
              <div>
                <p className="display mb-3 text-sm tracking-widest text-paper-dim">
                  COLLECTIONS
                </p>
                <ul className="space-y-1">
                  {COLLECTIONS.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-2 py-1.5 text-base text-paper-dim transition-colors hover:text-volt"
                      >
                        {c.label}
                        {c.hot && (
                          <span className="display bg-blood px-1.5 py-0.5 text-[10px] text-white">
                            HOT
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature tile */}
              <Link
                href="/collections/limited"
                onClick={() => setOpen(false)}
                className="group relative block overflow-hidden bg-ink-2"
              >
                {categories[0]?.image && (
                  <Image
                    src={categories[0].image}
                    alt=""
                    fill
                    sizes="360px"
                    className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="relative flex h-full min-h-44 flex-col justify-end p-5">
                  <p className="display text-3xl leading-none">
                    Limited<br />
                    <span className="text-volt">Never Restocked.</span>
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold">
                    Shop the vault <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
