"use client";

/** Friendly full-page fallback for the rare case where a page has no cached
 *  copy AND the API is unreachable (e.g. free-tier cold start mid-deploy). */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 text-center">
      <div>
        <p className="display text-4xl">
          REVOG<span className="text-volt">.</span>
        </p>
        <h1 className="display mt-6 text-2xl text-paper">Store is waking up…</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-dim">
          Give it a few seconds and try again — your cart is safe.
        </p>
        <button
          onClick={reset}
          className="display mt-6 bg-volt px-8 py-3 text-lg text-ink transition-transform hover:-translate-y-0.5"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
