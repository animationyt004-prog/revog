"use client";

/* eslint-disable @next/next/no-img-element */

import Script from "next/script";
import { flushPixelQueue } from "@/lib/pixel";

/**
 * Every Meta dataset that must receive storefront events.
 *
 * There are several, spread across two Business Managers, and which one a given
 * campaign optimises against has changed more than once. A dataset that misses
 * events is blind — no optimisation, no retargeting, and its catalog match rate
 * sits at zero — while an extra dataset receiving events costs nothing. So the
 * rule is "send to all of them", listed in NEXT_PUBLIC_META_PIXEL_IDS
 * (comma-separated); the two older single-ID vars are still honoured.
 *
 * Nothing is hardcoded as a fallback. NEXT_PUBLIC_ vars are baked in at build
 * time, so this list is fixed the moment the site is built — and a pixel id
 * left in source is one that keeps firing after it should have stopped, on
 * whichever branch nobody remembered to edit. Keep the API's META_PIXEL_IDS in
 * step, or the server half reports to a different set of datasets.
 */
const PIXEL_IDS = (
  process.env.NEXT_PUBLIC_META_PIXEL_IDS
    ? process.env.NEXT_PUBLIC_META_PIXEL_IDS.split(",")
    : [
        process.env.NEXT_PUBLIC_META_PIXEL_ID,
        process.env.NEXT_PUBLIC_ADDITIONAL_META_PIXEL_ID,
      ]
)
  .map((id) => (id ?? "").trim())
  .filter(
    (id, index, ids) => /^\d{10,20}$/.test(id) && ids.indexOf(id) === index,
  );

if (PIXEL_IDS.length === 0 && typeof window !== "undefined") {
  console.warn(
    "[meta-pixel] No pixel IDs configured — no Meta events will be sent. " +
      "Set NEXT_PUBLIC_META_PIXEL_IDS (comma-separated) at build time.",
  );
}

const INIT_PIXELS = PIXEL_IDS.map(
  (pixelId) => `window.fbq('init', '${pixelId}');`,
).join("\n");

/**
 * Loads one Meta base script and initializes every configured Pixel. It
 * deliberately does NOT fire PageView itself.
 *
 * Every PageView — first load and each client-side route change — goes through
 * `track()` instead, which sends the browser and Conversions API copies with a
 * shared event id. Firing one here as well would produce an id-less duplicate
 * that Meta cannot collapse against the server event.
 */
export function MetaPixel() {
  // With nothing to init, the base script is a third-party download that can
  // only sit there. Don't ship it.
  if (PIXEL_IDS.length === 0) return null;

  return (
    <>
      <noscript>
        {/* No JS means no track() call either, so this is the only PageView
            such a visitor produces — nothing to deduplicate against. */}
        {PIXEL_IDS.map((pixelId) => (
          <img
            key={pixelId}
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          />
        ))}
      </noscript>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={flushPixelQueue}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          ${INIT_PIXELS}
        `}
      </Script>
    </>
  );
}
