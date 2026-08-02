"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

const DISMISS_KEY = "hyra:promo-dismissed";
const HOLD_MS = 4000;

/**
 * Announcement strip above the header. One line at a time, sliding up on a
 * four-second hold rather than scrolling continuously: a marquee makes the
 * reader wait for the line they care about and never sits still long enough
 * on a phone to finish it.
 *
 * Every claim here has to be one the checkout honours — HYRA10 is a live
 * coupon, ₹999 is the real free-shipping threshold. Advertising a code that
 * fails at checkout costs more than the code was ever going to earn.
 */
const MESSAGES = [
  "Use code HYRA10 — 10% off orders above ₹999",
  "Free shipping on orders above ₹999",
  "Cash on Delivery available",
  "Easy 7-day returns",
];

export function PromoTicker() {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Private-mode browsers throw on storage access; showing the bar is the
      // harmless outcome.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), HOLD_MS);
    return () => clearInterval(t);
  }, [paused]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Closing for this render is enough.
    }
  }

  if (ready && dismissed) return null;

  return (
    <div
      className="relative bg-paper text-ink"
      aria-label="Current offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fixed height with the lines stacked inside it: animating height would
          shove the whole page down every four seconds. */}
      <div className="relative mx-auto h-9 max-w-7xl overflow-hidden px-10">
        {MESSAGES.map((msg, i) => (
          <p
            key={msg}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-x-10 top-0 flex h-9 items-center justify-center text-center text-[11px] tracking-wide transition-all duration-500 sm:text-xs",
              i === index
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0",
            )}
          >
            {msg}
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
