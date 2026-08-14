"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";

/** Resumes the session (refresh cookie) and loads the cart once per app load.
 *  Cart loads after auth settles so a login-merged cart shows correctly. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuth((s) => s.bootstrap);
  const fetchCart = useCart((s) => s.fetchCart);
  const hydrateWishlist = useWishlist((s) => s.hydrate);

  useEffect(() => {
    // Session recovery is the critical path. Start it before any optional
    // device-local hydration so account access cannot be blocked by storage.
    void bootstrap().then(fetchCart);
    hydrateWishlist();
  }, [bootstrap, fetchCart, hydrateWishlist]);

  return children;
}
