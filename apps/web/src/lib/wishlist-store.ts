"use client";

import { create } from "zustand";

const KEY = "revog:wishlist";

/** Device-local wishlist: zero login friction for guests, instant hearts.
 *  (Server-side sync can layer on later — schema already supports it.) */
function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

interface WishlistState {
  slugs: string[];
  hydrated: boolean;
  hydrate: () => void;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  slugs: [],
  hydrated: false,

  hydrate: () => {
    if (!get().hydrated) set({ slugs: read(), hydrated: true });
  },

  toggle: (slug) => {
    const current = get().hydrated ? get().slugs : read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    set({ slugs: next, hydrated: true });
  },

  has: (slug) => get().slugs.includes(slug),
}));
