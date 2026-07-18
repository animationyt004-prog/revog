"use client";

import { useEffect } from "react";
import { pixelPurchaseOnce } from "@/lib/pixel";
import { gtagPurchaseOnce } from "@/lib/gtag";

/** Fires the Meta Pixel Purchase event and the Google Ads purchase conversion
 *  once per order (server-rendered order page drops this in). Both are deduped
 *  against refreshes via sessionStorage. */
export function PixelPurchase({ orderNumber, total }: { orderNumber: string; total: number }) {
  useEffect(() => {
    pixelPurchaseOnce(orderNumber, total);
    gtagPurchaseOnce(orderNumber, total);
  }, [orderNumber, total]);
  return null;
}
