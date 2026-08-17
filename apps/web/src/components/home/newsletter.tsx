"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { amp } from "@/components/typography";
import { track } from "@/lib/track";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/**
 * The HYRALUXE EDIT — the homepage's one quiet ask, after the story and the
 * reviews have earned it. Same endpoint the welcome popup uses, so every
 * subscriber lands in one place regardless of where they signed up.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Something went wrong.");
      }
      setDone(true);
      track("LEAD", { contentName: "Newsletter signup" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Join the HyraLuxe Edit"
      className="border-t border-paper/10 bg-night text-ink"
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <FadeUp>
          <p className="text-xs tracking-[0.2em] text-gold">
            JOIN THE HYRALUXE EDIT
          </p>
          <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">
            First to see every new drop.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/60">
            {amp(
              "New collections, restocks & occasional offers — a few emails a month, nothing more.",
            )}
          </p>

          {done ? (
            <p
              className="mx-auto mt-8 max-w-md text-sm text-gold"
              role="status"
            >
              You&apos;re in. Watch your inbox for the next edit.
            </p>
          ) : (
            <form
              onSubmit={submit}
              className="mx-auto mt-8 flex max-w-md gap-2"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="min-w-0 flex-1 rounded-full border border-paper/20 bg-night-2 px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-night transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}
          {error && (
            <p className="mt-3 text-sm text-blood" role="alert">
              {error}
            </p>
          )}
        </FadeUp>
      </div>
    </section>
  );
}
