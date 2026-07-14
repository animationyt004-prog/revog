"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, Loader2, Mail, X } from "lucide-react";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/auth-store";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { status, requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  // Already logged in? Straight to the account page.
  useEffect(() => {
    if (status === "authed") router.replace("/account");
  }, [status, router]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendOtp() {
    setBusy(true);
    setError(null);
    try {
      await requestOtp(email.trim());
      setStep("otp");
      setResendIn(30);
      setTimeout(() => otpRef.current?.focus(), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email.trim(), code.trim());
      router.replace("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Incorrect OTP.");
      setCode("");
      otpRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PromoTicker />
      <main className="relative flex min-h-svh flex-col overflow-hidden">
        {/* Ghost background type */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center opacity-50">
          <div className="flex w-max animate-marquee-slow whitespace-nowrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="display text-outline mx-4 text-[24vw] leading-none sm:text-[14vw]">
                AFTER HOURS
              </span>
            ))}
          </div>
        </div>

        {/* Login is optional — always give a visible exit back to shopping. */}
        <Link
          href="/"
          aria-label="Close and continue shopping"
          className="absolute right-4 top-12 z-20 grid h-10 w-10 place-items-center border border-paper/20 text-paper-dim transition-colors hover:border-volt hover:text-volt sm:right-6"
        >
          <X size={20} />
        </Link>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
          <Link href="/" className="display mb-10 text-center text-3xl">
            NO&nbsp;CURFEW<span className="text-volt">.</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="display text-4xl">
                  Enter The <span className="text-volt">Club.</span>
                </h1>
                <p className="mt-2 text-sm text-paper-dim">
                  No passwords here. We&apos;ll mail you a one-time code.
                </p>

                <form
                  className="mt-8"
                  onSubmit={(e) => { e.preventDefault(); void sendOtp(); }}
                >
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold tracking-widest text-paper-dim">
                    EMAIL
                  </label>
                  <div className="flex items-center gap-2 border border-paper/25 bg-ink-2 px-3 focus-within:border-volt">
                    <Mail size={16} className="text-paper-dim" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-paper-dim/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !email.includes("@")}
                    className={cn(
                      "display mt-5 flex w-full items-center justify-center gap-2 py-4 text-xl transition-all",
                      busy || !email.includes("@")
                        ? "cursor-not-allowed bg-ink-3 text-paper-dim"
                        : "bg-volt text-ink hover:-translate-y-0.5",
                    )}
                  >
                    {busy ? <Loader2 size={20} className="animate-spin" /> : <>Send OTP <ArrowRight size={20} /></>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="display text-4xl">
                  Check Your <span className="text-volt">Mail.</span>
                </h1>
                <p className="mt-2 text-sm text-paper-dim">
                  6-digit code sent to <span className="text-paper">{email}</span>
                </p>

                <form
                  className="mt-8"
                  onSubmit={(e) => { e.preventDefault(); void submitOtp(); }}
                >
                  <label htmlFor="otp" className="mb-1.5 block text-xs font-semibold tracking-widest text-paper-dim">
                    ONE-TIME CODE
                  </label>
                  <div className="flex items-center gap-2 border border-paper/25 bg-ink-2 px-3 focus-within:border-volt">
                    <KeyRound size={16} className="text-paper-dim" />
                    <input
                      id="otp"
                      ref={otpRef}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full bg-transparent py-3.5 text-center text-2xl tracking-[0.6em] outline-none placeholder:text-paper-dim/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className={cn(
                      "display mt-5 flex w-full items-center justify-center gap-2 py-4 text-xl transition-all",
                      busy || code.length !== 6
                        ? "cursor-not-allowed bg-ink-3 text-paper-dim"
                        : "bg-volt text-ink hover:-translate-y-0.5",
                    )}
                  >
                    {busy ? <Loader2 size={20} className="animate-spin" /> : "Verify & Enter"}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between text-xs text-paper-dim">
                  <button onClick={() => { setStep("email"); setError(null); }} className="underline hover:text-paper">
                    Change email
                  </button>
                  <button
                    disabled={resendIn > 0 || busy}
                    onClick={() => void sendOtp()}
                    className={cn("underline", resendIn > 0 ? "cursor-not-allowed opacity-50" : "hover:text-volt")}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border border-blood/50 bg-blood/10 px-3 py-2.5 text-sm text-blood"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <Link
            href="/"
            className="mt-8 block text-center text-sm text-paper-dim underline underline-offset-4 transition-colors hover:text-volt"
          >
            Skip for now — continue shopping
          </Link>

          <p className="mt-6 text-center text-xs text-paper-dim">
            Login is optional. You only need it to track orders & returns —
            browsing and checkout work without it. New here? An account is
            created automatically on first login.
          </p>
        </div>
      </main>
    </>
  );
}
