"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const line = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: 0,
    transition: { duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Full-viewport typographic hero — loud, dark, kinetic. */
export function Hero() {
  return (
    <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden bg-ink">
      {/* Ghost background type, drifting slowly */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center opacity-60">
        <div className="flex w-max animate-marquee-slow whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="display text-outline mx-4 text-[22vw] leading-none sm:text-[16vw]">
              REVOG
            </span>
          ))}
        </div>
      </div>

      {/* Volt corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-volt/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-4 inline-block border border-volt/60 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-volt"
        >
          DROP 01 — LIVE NOW
        </motion.p>

        <h1 className="display text-[17vw] leading-[0.9] sm:text-[11vw] lg:text-[9rem]">
          {["THE STREETS", "DON'T SLEEP."].map((text, i) => (
            <span key={text} className="block overflow-hidden pb-1">
              <motion.span
                className={`block ${i === 1 ? "text-volt" : ""}`}
                variants={line}
                custom={i}
                initial="hidden"
                animate="visible"
              >
                {text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-5 max-w-md text-sm leading-relaxed text-paper-dim sm:text-base"
        >
          Heavyweight oversized fits, engineered in India. No permission asked,
          no restock promised.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link
            href="/collections/new-arrivals"
            className="display group inline-flex items-center gap-2 bg-volt px-7 py-3.5 text-lg text-ink transition-transform hover:-translate-y-0.5"
          >
            Shop New Drops
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/collections/bestsellers"
            className="display inline-flex items-center border border-paper/30 px-7 py-3.5 text-lg text-paper transition-colors hover:border-volt hover:text-volt"
          >
            Best Sellers
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
