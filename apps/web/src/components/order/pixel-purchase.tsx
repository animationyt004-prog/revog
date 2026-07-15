"use client";

import { useEffect } from "react";
import { pixelPurchaseOnce } from "@/lib/pixel";

/** Fires the Meta Pixel Purchase event once per order (server-rendered order
 *  page drops this in). Deduped against refreshes via sessionStorage. */
export function PixelPurchase({ orderNumber, total }: { orderNumber: string; total: number }) {
  useEffect(() => {
    pixelPurchaseOnce(orderNumber, total);
  }, [orderNumber, total]);
  return null;
}
