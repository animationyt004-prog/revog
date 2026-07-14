"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartOff, Loader2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { ProductCard } from "@/components/product/product-card";
import { useWishlist } from "@/lib/wishlist-store";
import type { ProductCardData } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function WishlistPage() {
  const { slugs, hydrated, hydrate } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }
    // Catalog is small — fetch once and filter to hearted slugs.
    fetch(`${API}/products?take=48`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: ProductCardData[] }) =>
        setProducts(data.items.filter((p) => slugs.includes(p.slug))),
      )
      .catch(() => setProducts([]));
  }, [hydrated, slugs]);

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="display text-5xl sm:text-6xl">
          Wishlist<span className="text-volt">.</span>
        </h1>
        <p className="mt-2 text-sm text-paper-dim">
          Saved on this device — hearts survive refreshes, no login needed.
        </p>

        {products === null ? (
          <div className="grid place-items-center py-24">
            <Loader2 size={26} className="animate-spin text-volt" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <HeartOff size={48} className="mx-auto text-paper-dim" strokeWidth={1.2} />
            <p className="display mt-4 text-2xl text-paper-dim">Nothing saved yet.</p>
            <p className="mt-1 text-sm text-paper-dim">
              Tap the ♥ on any product to keep it here.
            </p>
            <Link
              href="/collections/new-arrivals"
              className="display mt-6 inline-block bg-volt px-6 py-3 text-lg text-ink"
            >
              Browse New Drops
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
