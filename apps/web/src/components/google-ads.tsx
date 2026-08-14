"use client";

import Script from "next/script";
import { ADS_IDS, GA4_ID } from "@/lib/google-ads-config";

/** Loads one global site tag for Google Ads and GA4. */
export function GoogleAds() {
  const loaderId = ADS_IDS[0] ?? GA4_ID;
  if (!loaderId) return null;

  return (
    <>
      {/* One script load is enough; the extra accounts come from config calls. */}
      <Script
        id="gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${ADS_IDS.map((id) => `gtag('config', '${id}');`).join("\n          ")}
          ${GA4_ID ? `gtag('config', '${GA4_ID}', { send_page_view: false });` : ""}
        `}
      </Script>
    </>
  );
}
