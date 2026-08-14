"use client";

import { useEffect } from "react";
import { pixelPurchaseOnce, type PixelContent } from "@/lib/pixel";
import { gtagPurchaseOnce } from "@/lib/gtag";

/** Fires the Meta Pixel Purchase event and the Google Ads purchase conversion
 *  once per order (server-rendered order page drops this in). The order page
 *  only renders this on arrival from checkout; both calls then dedupe against
 *  repeat views, and the Meta event carries the same id the API sends from the
 *  payment path so the two sides collapse into one conversion. */
export function PixelPurchase({
  orderNumber,
  total,
  contents,
}: {
  orderNumber: string;
  total: number;
  contents?: PixelContent[];
}) {
  useEffect(() => {
    pixelPurchaseOnce(orderNumber, total, contents);
    gtagPurchaseOnce(orderNumber, total);
    // contents is a fresh array each render; the order number identifies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, total]);
  return null;
}
