"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ImagePlus, Loader2, Star, X } from "lucide-react";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  author: string;
  photoUrl: string | null;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? "fill-volt text-volt" : "text-paper-dim/40"}
        />
      ))}
    </span>
  );
}

export function ReviewsSection({ slug }: { slug: string }) {
  const { status } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/products/${slug}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [slug]);

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authedFetch(`/products/${slug}/reviews/photo`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };
      if (!res.ok || !data.url)
        throw new Error(data.message ?? "Could not upload photo.");
      setPhotoUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(load, [load]);

  async function submit() {
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch(`/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
          photoUrl: photoUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string | string[];
        };
        throw new Error(
          Array.isArray(data.message)
            ? data.message[0]
            : (data.message ?? "Could not post review."),
        );
      }
      setDone(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
      <h2 className="display mb-5 text-3xl sm:text-4xl">
        Reviews<span className="text-volt">.</span>
      </h2>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Write */}
        <div className="h-fit border border-paper/10 bg-ink-2 p-5">
          {status !== "authed" ? (
            <p className="text-sm text-paper-dim">
              Bought this?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`}
                className="underline hover:text-volt"
              >
                Log in
              </Link>{" "}
              to leave a review — orders placed with your email count as
              verified purchases.
            </p>
          ) : done ? (
            <p className="text-sm font-semibold text-volt">
              ✓ Review posted. Thanks for the word.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <p className="display mb-2 text-lg">Drop your take</p>
              <div
                className="flex gap-1"
                onMouseLeave={() => setHoverRating(0)}
                role="radiogroup"
                aria-label="Rating"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onMouseEnter={() => setHoverRating(n)}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                    className="p-0.5"
                  >
                    <Star
                      size={24}
                      className={cn(
                        "transition-colors",
                        n <= (hoverRating || rating)
                          ? "fill-volt text-volt"
                          : "text-paper-dim/40",
                      )}
                    />
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Headline (optional)"
                className="mt-3 w-full border border-paper/25 bg-ink px-3 py-2.5 text-sm outline-none focus:border-volt"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Fit, fabric, wash test — the streets want details."
                className="mt-2 w-full resize-y border border-paper/25 bg-ink px-3 py-2.5 text-sm outline-none focus:border-volt"
              />
              <div className="mt-3">
                {photoUrl ? (
                  <div className="relative aspect-[4/3] w-36 overflow-hidden border border-paper/15">
                    <Image
                      src={photoUrl}
                      alt="Customer review upload"
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      aria-label="Remove review photo"
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center bg-ink/85 text-paper"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-paper/25 px-3 py-2 text-xs hover:border-volt">
                    {uploading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <ImagePlus size={15} />
                    )}
                    Add a real product photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      onChange={(event) =>
                        void uploadPhoto(event.target.files?.[0])
                      }
                      className="sr-only"
                    />
                  </label>
                )}
                <p className="mt-1 text-[11px] text-paper-dim">
                  Available for delivered orders. JPG, PNG, WebP or AVIF under 8
                  MB.
                </p>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="display mt-3 bg-volt px-6 py-2.5 text-base text-ink disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Post Review"
                )}
              </button>
              {error && <p className="mt-2 text-xs text-blood">{error}</p>}
            </form>
          )}
        </div>

        {/* List */}
        <div>
          {reviews === null ? (
            <Loader2 size={22} className="animate-spin text-volt" />
          ) : reviews.length === 0 ? (
            <p className="text-sm text-paper-dim">
              No reviews yet — be the first on the block.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <article key={r.id} className="border-b border-paper/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold">{r.author}</span>
                    {r.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 bg-volt/10 px-1.5 py-0.5 text-[11px] font-semibold text-volt">
                        <BadgeCheck size={12} /> Verified Purchase
                      </span>
                    )}
                    <span className="ml-auto text-xs text-paper-dim">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.title && (
                    <p className="mt-1.5 text-sm font-semibold">{r.title}</p>
                  )}
                  {r.body && (
                    <p className="mt-1 text-sm leading-relaxed text-paper-dim">
                      {r.body}
                    </p>
                  )}
                  {r.photoUrl && (
                    <div className="relative mt-3 aspect-[4/3] w-44 overflow-hidden border border-paper/10">
                      <Image
                        src={r.photoUrl}
                        alt={`Photo review by ${r.author}`}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
