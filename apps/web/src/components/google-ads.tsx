"use client";

import Script from "next/script";
import { ADS_IDS, GA4_ID } from "@/lib/google-ads-config";

/** Loads the Google Ads global site tag (gtag.js) for conversion tracking.
 *  Renders nothing until at least one Ads ID (AW-XXXXXXXXXX) is configured. */
export function GoogleAds() {
  if (!ADS_IDS.length) return null;

  return (
    <>
      {/* One script load is enough; the extra accounts come from config calls. */}
      <Script
        id="gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_IDS[0]}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${ADS_IDS.map((id) => `gtag('config', '${id}');`).join("\n          ")}
          ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
