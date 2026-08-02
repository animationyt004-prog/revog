"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { MegaMenu } from "./mega-menu";
import { Wordmark } from "./wordmark";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Always-valid links; category links are added from what's actually in stock. */
const STATIC_LINKS = [
  { label: "New In", href: "/collections/new-arrivals" },
  { label: "Best Sellers", href: "/collections/bestsellers" },
];

/** Sticky navbar. Full mega menu lands in Phase 2 — this is the frame. */
export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Category links come from the catalog so the nav can never point at an
  // empty category (which used to happen whenever the range changed).
  const [navLinks, setNavLinks] = useState(STATIC_LINKS);
  const authed = useAuth((s) => s.status === "authed");
  const itemCount = useCart((s) => s.cart?.summary.itemCount ?? 0);
  const openDrawer = useCart((s) => s.openDrawer);
  // The wishlist lives in localStorage and only reads it once asked, so the
  // header has to prompt the hydrate — otherwise the badge sits at zero even
  // when the list has items in it.
  const hydrateWishlist = useWishlist((s) => s.hydrate);
  const wishCount = useWishlist((s) => (s.hydrated ? s.slugs.length : 0));

  useEffect(() => {
    hydrateWishlist();
  }, [hydrateWishlist]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((cats: { name: string; slug: string; _count: { products: number } }[]) => {
        const stocked = cats
          .filter((c) => c._count.products > 0)
          .slice(0, 3)
          .map((c) => ({ label: c.name, href: `/category/${c.slug}` }));
        if (stocked.length) setNavLinks([STATIC_LINKS[0], ...stocked, STATIC_LINKS[1]]);
      })
      .catch(() => undefined);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-night text-white transition-shadow",
        scrolled && "shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
      )}
    >
      {/* Row one: search, centred wordmark, account actions. The logo sits in
          the middle on its own line so it reads as the brand mark rather than
          one item in a row of links. */}
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-20 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            className="p-1 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-white/55"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products…"
                className="w-44 border-0 border-b border-white/30 bg-transparent py-1.5 pl-6 pr-2 text-sm text-white outline-none transition-all placeholder:text-white/45 focus:w-56 focus:border-gold"
              />
            </label>
          </form>
        </div>

        <Link href="/" aria-label="Hyra Fashion — home" className="justify-self-center">
          <Wordmark size="sm" tone="dark" className="items-center" />
        </Link>

        <div className="flex items-center justify-end gap-4 sm:gap-5">
          <Link
            href={authed ? "/account" : "/login"}
            aria-label={authed ? "Account" : "Login"}
            className="relative hidden transition-colors hover:text-gold sm:block"
          >
            <User size={20} />
            {authed && (
              <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-gold" />
            )}
          </Link>
          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishCount} items`}
            className="relative hidden transition-colors hover:text-gold sm:block"
          >
            <Heart size={20} />
            {wishCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-0.5 text-[10px] font-bold text-paper">
                {wishCount}
              </span>
            )}
          </Link>
          <button
            aria-label={`Cart, ${itemCount} items`}
            onClick={openDrawer}
            className="relative transition-colors hover:text-gold"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-0.5 text-[10px] font-bold text-paper">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Row two: the category rail. Desktop only — on a phone these live in
          the drawer, where they have room to be tapped. */}
      <nav aria-label="Categories" className="hidden border-t border-white/12 md:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-3">
          <MegaMenu />
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:text-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/12 bg-night px-6 py-4 md:hidden">
          <form onSubmit={submitSearch}>
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/55"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kurtis, sarees, shirts"
                className="w-full border border-white/20 bg-night-2 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-gold"
              />
            </label>
          </form>
          <ul className="mt-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="display block py-2.5 text-2xl text-white transition-colors hover:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={authed ? "/account" : "/login"}
                onClick={() => setOpen(false)}
                className="display block py-2.5 text-2xl text-white transition-colors hover:text-gold"
              >
                {authed ? "Account" : "Login"}
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="display block py-2.5 text-2xl text-white transition-colors hover:text-gold"
              >
                Wishlist
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
