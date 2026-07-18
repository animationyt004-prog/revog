"use client";

import Script from "next/script";

// Public Google Ads conversion ID (visible in page HTML anyway). Falls back to
// REVOG's ID so it works without extra Render config; override via env if needed.
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18327470048";

/** Loads the Google Ads global site tag (gtag.js) for conversion tracking.
 *  Renders nothing until an Ads ID (AW-XXXXXXXXXX) is configured. */
export function GoogleAds() {
  if (!ADS_ID) return null;

  return (
    <>
      <Script
        id="gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
        `}
      </Script>
    </>
  );
}
