"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "hyra:promo-dismissed";

/**
 * Announcement strip above the header. Three fixed messages rather than a
 * marquee: a scrolling strip means a shopper has to wait for the line they
 * care about to come round, and on a phone it never sat still long enough to
 * read. On narrow screens only the shipping line survives — the other two are
 * repeated in the trust strip a screen below.
 *
 * Dismissal is remembered for the session so it doesn't reappear on every
 * navigation, but comes back next visit.
 */
const MESSAGES = [
  { text: "Free shipping on orders above ₹999", always: true },
  { text: "New collection '26 — elevate your ethnic style", always: false },
  { text: "COD available | Easy returns", always: false },
];

export function PromoTicker() {
  const [dismissed, setDismissed] = useState(false);
  // Read on mount rather than during render: sessionStorage isn't available
  // while the server renders this, and reading it inline would desync
  // hydration.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Private-mode browsers can throw on storage access; showing the bar is
      // the harmless outcome.
    }
    setReady(true);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to do — the bar closes for this render either way.
    }
  }

  if (ready && dismissed) return null;

  return (
    <div className="relative bg-paper text-ink" aria-label="Current offers">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-2 px-4 py-2 pr-10 text-center text-[11px] tracking-wide sm:grid-cols-3 sm:px-6 sm:text-xs">
        {MESSAGES.map((m) => (
          <p
            key={m.text}
            className={
              m.always
                ? "sm:text-left"
                : "hidden sm:block sm:last:text-right"
            }
          >
            {m.text}
          </p>
        ))}
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss offers"
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink/70 transition-colors hover:text-ink sm:right-4"
      >
        <X size={15} />
      </button>
    </div>
  );
}
