"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const SEEN_KEY = "revog_welcome_v1";
// Don't interrupt these flows with a marketing popup.
const HIDE_ON = ["/admin", "/checkout", "/login", "/order"];

/** First-visit welcome offer — captures an email for the newsletter and reveals
 *  a discount code. Guest-first: fully dismissible, shows once per browser, and
 *  never blocks browsing (it stays out of checkout/login/admin). */
export function WelcomePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (HIDE_ON.some((p) => pathname.startsWith(p))) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [pathname]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function submit() {
    if (busy) return;
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
        body: JSON.stringify({ email, ...(phone.length === 10 ? { phone } : {}) }),
      });
      const d = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (!res.ok || !d.code) throw new Error(d.message ?? "Something went wrong.");
      setCode(d.code);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => undefined,
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome offer"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden border bg-ink sm:grid sm:grid-cols-2"
        style={{
          borderColor: "rgba(201,162,75,0.5)",
          boxShadow: "0 25px 60px rgba(94,15,43,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-paper transition-colors hover:bg-ink"
        >
          <X size={18} />
        </button>

        {/* Premium festive banner — deep wine → rose with gold accents */}
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-10 text-center sm:py-14"
          style={{ background: "linear-gradient(150deg, #5e0f2b 0%, #8a1a42 52%, #b23260 100%)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-52 w-52 -translate-x-1/2"
            style={{ background: "radial-gradient(circle, rgba(212,175,89,0.35), transparent 70%)" }}
          />
          {/* gold frame */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 border"
            style={{ borderColor: "rgba(212,175,89,0.35)" }}
          />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.35em]"
            style={{ color: "#e7c983" }}
          >
            Welcome Offer
          </p>
          <div className="my-3 h-px w-10" style={{ background: "#d4af59" }} />
          <p className="display text-6xl leading-none text-white sm:text-7xl">
            10<span style={{ color: "#e7c983" }}>%</span>
          </p>
          <p className="display mt-1 text-xl tracking-[0.35em] text-white/90">OFF</p>
          <p className="mt-4 max-w-[15rem] text-xs leading-relaxed text-white/75">
            On your first order above ₹999.
            <br />
            Welcome to Hyra Fashion.
          </p>
        </div>

        {/* Form / reward */}
        <div className="px-6 py-8 sm:py-10">
          {code ? (
            <div className="text-center">
              <p className="display text-2xl">You&apos;re in! 🎉</p>
              <p className="mt-2 text-sm text-paper-dim">Use this code at checkout:</p>
              <button
                onClick={copyCode}
                className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed py-3.5 text-lg font-bold tracking-[0.2em] transition-colors"
                style={{
                  borderColor: "#c9a24b",
                  color: "#8a1a42",
                  background: "linear-gradient(180deg, #fbf3e2 0%, #f6e9cf 100%)",
                }}
              >
                {code}
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <Link
                href="/category/sarees"
                onClick={dismiss}
                className="display mt-4 inline-block w-full bg-volt py-3 text-lg text-ink transition-transform hover:-translate-y-0.5"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <>
              <p className="display text-2xl sm:text-3xl">Unlock 10% off</p>
              <p className="mt-1 text-sm text-paper-dim">
                Join our list for the code and first dibs on new drops.
              </p>

              <form
                className="mt-5 space-y-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  aria-label="Email address"
                  className="w-full border border-paper/25 bg-ink-2 px-3 py-2.5 text-sm outline-none focus:border-volt"
                />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Mobile number (optional)"
                  aria-label="Mobile number"
                  className="w-full border border-paper/25 bg-ink-2 px-3 py-2.5 text-sm outline-none focus:border-volt"
                />
                <label className="flex items-center gap-2 py-1 text-xs text-paper-dim">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="accent-volt"
                  />
                  Notify me about offers &amp; new arrivals
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    "display w-full py-3 text-lg transition-transform",
                    busy ? "cursor-not-allowed bg-ink-3 text-paper-dim" : "bg-volt text-ink hover:-translate-y-0.5",
                  )}
                >
                  {busy ? "Please wait…" : "Get My Code"}
                </button>
                {error && <p className="text-xs text-blood">{error}</p>}
              </form>

              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-xs text-paper-dim underline underline-offset-2"
              >
                No thanks, continue shopping
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
