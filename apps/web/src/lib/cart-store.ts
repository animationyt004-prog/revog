"use client";

import { create } from "zustand";
import { useAuth } from "./auth-store";
import { pixelTrack } from "./pixel";
import type { CartView } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Cart calls work for guests (cookie) and users (Bearer) alike. */
async function cartFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuth.getState().accessToken;
  return fetch(`${API}${path}`, {
    ...init,
    credentials: "include", // rv_cart guest cookie
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    return Array.isArray(data.message) ? data.message[0] : (data.message ?? fallback);
  } catch {
    return fallback;
  }
}

interface CartState {
  cart: CartView | null;
  drawerOpen: boolean;
  busy: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export const useCart = create<CartState>((set, get) => {
  /** Run a mutating cart call and swap in the returned cart view. */
  async function mutate(path: string, init: RequestInit, fallbackError: string) {
    set({ busy: true });
    try {
      const res = await cartFetch(path, init);
      if (!res.ok) throw new Error(await errorMessage(res, fallbackError));
      set({ cart: (await res.json()) as CartView });
    } finally {
      set({ busy: false });
    }
  }

  return {
    cart: null,
    drawerOpen: false,
    busy: false,

    openDrawer: () => set({ drawerOpen: true }),
    closeDrawer: () => set({ drawerOpen: false }),

    fetchCart: async () => {
      try {
        const res = await cartFetch("/cart");
        if (res.ok) set({ cart: (await res.json()) as CartView });
      } catch {
        // API unreachable — leave cart as-is; next action retries.
      }
    },

    addItem: async (variantId, quantity = 1) => {
      await mutate(
        "/cart/items",
        { method: "POST", body: JSON.stringify({ variantId, quantity }) },
        "Could not add to cart.",
      );
      pixelTrack("AddToCart", {
        content_ids: [variantId],
        content_type: "product",
        value: (get().cart?.summary.subtotal ?? 0) / 100,
        currency: "INR",
      });
      set({ drawerOpen: true });
    },

    updateQuantity: (itemId, quantity) =>
      mutate(
        `/cart/items/${itemId}`,
        { method: "PATCH", body: JSON.stringify({ quantity }) },
        "Could not update quantity.",
      ),

    removeItem: (itemId) =>
      mutate(`/cart/items/${itemId}`, { method: "DELETE" }, "Could not remove item."),

    applyCoupon: (code) =>
      mutate(
        "/cart/coupon",
        { method: "POST", body: JSON.stringify({ code }) },
        "Invalid coupon.",
      ),

    removeCoupon: () =>
      mutate("/cart/coupon", { method: "DELETE" }, "Could not remove coupon."),
  };
});
