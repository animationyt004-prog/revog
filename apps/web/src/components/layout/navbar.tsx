"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/format";

const NAV_LINKS = [
  { label: "New Drops", href: "/collections/new-arrivals" },
  { label: "Tees", href: "/category/oversized-tees" },
  { label: "Hoodies", href: "/category/hoodies" },
  { label: "Cargos", href: "/category/cargos" },
  { label: "Joggers", href: "/category/joggers" },
  { label: "Shirts", href: "/category/shirts" },
];

/** Sticky navbar. Full mega menu lands in Phase 2 — this is the frame. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-paper/10 bg-ink/80 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        {/* Mobile menu toggle */}
        <button
          className="p-1 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Wordmark */}
        <Link href="/" className="display text-xl leading-none sm:text-2xl">
          NO&nbsp;CURFEW<span className="text-volt">.</span>
        </Link>

        {/* Desktop links */}
        <ul className="ml-8 hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm font-medium text-paper-dim transition-colors hover:text-volt"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-4 sm:gap-5">
          <button aria-label="Search" className="transition-colors hover:text-volt">
            <Search size={20} />
          </button>
          <Link href="/account" aria-label="Account" className="hidden transition-colors hover:text-volt sm:block">
            <User size={20} />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="hidden transition-colors hover:text-volt sm:block">
            <Heart size={20} />
          </Link>
          <button aria-label="Cart" className="relative transition-colors hover:text-volt">
            <ShoppingBag size={20} />
            <span className="absolute -right-2 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-volt text-[10px] font-bold text-ink">
              0
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <ul className="border-t border-paper/10 bg-ink px-6 py-4 md:hidden">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="display block py-2.5 text-2xl text-paper transition-colors hover:text-volt"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
