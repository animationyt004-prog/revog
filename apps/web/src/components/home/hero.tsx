"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

const ADVANCE_MS = 5000;

/**
 * Opening banner. Client component for the carousel state, but React still
 * renders the first slide server-side, so the LCP image is in the SSR HTML
 * and does not wait on hydration — the reason the first shot carries
 * `priority` and the rest do not.
 *
 * Backdrops are real catalogue photography rather than separate creative:
 * the supplier's model shots already read as editorial, and sourcing them
 * from stock means the banner can never advertise something we don't sell.
 */
export function Hero({ products = [] }: { products?: ProductCardData[] }) {
  const slides = products.filter((p) => p.image).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Auto-advance, held while the pointer or keyboard focus is inside the
  // banner so it can't yank a slide away mid-read. Skipped outright for
  // anyone who has asked the OS to reduce motion.
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduced.current) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ADVANCE_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="New collection"
      className="relative isolate overflow-hidden bg-ink-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Only the current slide and the one queued behind it are mounted.
          Every slide fills the banner, so a lazy one still intersects the
          viewport and downloads anyway — five catalogue shots is about a
          megabyte before anything else on the page has loaded. Mounting the
          next one keeps the crossfade smooth; stepping backwards mounts on
          demand, by which point the file is cached. */}
      {slides.map((p, i) => {
        const mounted = i === index || i === (index + 1) % count;
        if (!mounted) return null;
        return (
          <div
            key={p.id}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            {p.image && (
              <Image
                src={p.image.url}
                alt=""
                aria-hidden
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-[68%_25%]"
              />
            )}
          </div>
        );
      })}

      {/* Readability wash, weighted left where the copy sits so the garment
          on the right keeps its true colour. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink via-ink/88 to-ink/25 sm:to-transparent"
      />

      <div className="relative mx-auto flex h-[320px] max-w-7xl items-center px-4 sm:h-[480px] sm:px-6">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-volt">
            NEW COLLECTION
          </p>

          <h1 className="display mt-4 text-[9vw] leading-[1.05] sm:mt-5 sm:text-[5vw] lg:text-[3.9rem]">
            Timeless elegance.
            <span className="block italic text-volt">Redefined for you.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base">
            Indian fashion crafted for every moment that matters.
          </p>

          <Link
            href="/collections/new-arrivals"
            className="display group mt-6 inline-flex items-center gap-2 rounded-sm bg-paper px-7 py-3 text-base text-ink transition-all duration-300 hover:-translate-y-0.5 sm:mt-8 sm:px-9 sm:py-3.5 sm:text-lg"
          >
            Shop new arrivals
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-paper/25 bg-ink/50 text-paper backdrop-blur-sm transition-colors hover:border-volt hover:text-volt sm:grid sm:left-4"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-paper/25 bg-ink/50 text-paper backdrop-blur-sm transition-colors hover:border-volt hover:text-volt sm:grid sm:right-4"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1} of ${count}`}
                aria-current={i === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-volt" : "w-2 bg-paper/40 hover:bg-paper/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
