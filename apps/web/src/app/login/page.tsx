"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Clock3,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { cn } from "@/lib/format";
import { fetchLoginChannels, useAuth, type OtpChannel } from "@/lib/auth-store";
import { pixelTrack } from "@/lib/pixel";

type Step = "identifier" | "otp";

const FEATURE_IMAGE =
  "https://pub-1c439aae24bd4239bd4c425d68d03bfc.r2.dev/products/women-pearl-embellished-net-saree/white-01-main-36cc35.jpg";

function looksValid(raw: string, smsOn: boolean): boolean {
  const value = raw.trim();
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!smsOn) return false;
  const digits = value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits);
}

function safeDestination(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = safeDestination(params.get("next"));
  const { status, requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [smsOn, setSmsOn] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const completingLogin = useRef(false);

  useEffect(() => {
    void fetchLoginChannels().then((channels) => setSmsOn(channels.sms));
  }, []);

  useEffect(() => {
    if (status === "authed" && !completingLogin.current) {
      router.replace(destination);
    }
  }, [destination, router, status]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(
      () => setResendIn((seconds) => seconds - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendOtp() {
    setBusy(true);
    setError(null);
    try {
      setChannel(await requestOtp(identifier.trim()));
      setStep("otp");
      setResendIn(30);
      window.setTimeout(() => otpRef.current?.focus(), 50);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not send the code. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    setBusy(true);
    setError(null);
    completingLogin.current = true;
    try {
      const isNewUser = await verifyOtp(identifier.trim(), code);
      if (isNewUser) {
        pixelTrack("CompleteRegistration", {
          content_name: "HyraLuxe account",
          status: true,
        });
      }
      // A document navigation guarantees the account loads the latest client
      // bundle and restores from the refresh cookie. This avoids trapping a
      // customer on stale loading HTML after a production deployment.
      window.location.replace(destination);
    } catch (cause) {
      completingLogin.current = false;
      setError(
        cause instanceof Error ? cause.message : "Incorrect code. Try again.",
      );
      setCode("");
      otpRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-auth-page
      className="grid min-h-svh bg-ink lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]"
    >
      <section className="relative min-h-[32svh] overflow-hidden sm:min-h-[40svh] lg:min-h-svh">
        <Image
          src={FEATURE_IMAGE}
          alt="HyraLuxe white pearl embellished saree"
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-[center_22%]"
        />
        <div className="absolute inset-0 bg-night/30" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-12">
          <p className="text-xs font-semibold uppercase text-white/80">
            The HyraLuxe account
          </p>
          <h1 className="display mt-2 max-w-xl text-3xl sm:text-5xl">
            Your orders, returns and favourites. Together.
          </h1>
          <div className="mt-5 hidden flex-wrap gap-x-6 gap-y-2 text-xs text-white/85 sm:flex">
            <span className="flex items-center gap-1.5">
              <Check size={14} /> Track every order
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} /> Easy return requests
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} /> No password to remember
            </span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[68svh] flex-col px-5 py-6 sm:min-h-[60svh] sm:px-10 lg:min-h-svh lg:px-14 lg:py-10">
        <div className="flex items-start justify-between">
          <Link href="/" aria-label="HyraLuxe home">
            <Wordmark size="lg" />
          </Link>
          <Link
            href="/"
            aria-label="Close and continue shopping"
            title="Continue shopping"
            className="grid h-10 w-10 place-items-center border border-paper/20 text-paper-dim transition-colors hover:border-volt hover:text-volt"
          >
            <X size={19} />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 lg:py-14">
          <AnimatePresence mode="wait">
            {step === "identifier" ? (
              <motion.div
                key="identifier"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-xs font-semibold uppercase text-volt">
                  Private and password-free
                </p>
                <h2 className="display mt-2 text-4xl sm:text-5xl">
                  Welcome back.
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-paper-dim">
                  Enter your{" "}
                  {smsOn ? "email or mobile number" : "email address"}.
                  We&apos;ll send a secure 6-digit code.
                </p>

                <form
                  className="mt-8"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendOtp();
                  }}
                >
                  <label
                    htmlFor="identifier"
                    className="mb-2 block text-xs font-semibold text-paper-dim"
                  >
                    {smsOn ? "Email or mobile number" : "Email address"}
                  </label>
                  <div className="flex h-13 items-center gap-3 border border-paper/25 bg-white px-4 transition-colors focus-within:border-volt focus-within:ring-1 focus-within:ring-volt">
                    <AtSign size={17} className="shrink-0 text-paper-dim" />
                    <input
                      id="identifier"
                      type="text"
                      inputMode={smsOn ? "text" : "email"}
                      autoComplete="username"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(event) => {
                        setIdentifier(event.target.value);
                        setError(null);
                      }}
                      placeholder={
                        smsOn ? "Email or 10-digit mobile" : "you@example.com"
                      }
                      aria-describedby="identifier-help"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-paper-dim/60"
                    />
                  </div>
                  <p
                    id="identifier-help"
                    className="mt-2 flex items-center gap-1.5 text-xs text-paper-dim"
                  >
                    <LockKeyhole size={13} /> We never share your contact
                    details.
                  </p>

                  <button
                    type="submit"
                    disabled={busy || !looksValid(identifier, smsOn)}
                    className={cn(
                      "mt-5 flex h-13 w-full items-center justify-center gap-2 text-sm font-semibold transition-colors",
                      busy || !looksValid(identifier, smsOn)
                        ? "cursor-not-allowed bg-ink-3 text-paper-dim"
                        : "bg-volt text-white hover:bg-paper",
                    )}
                  >
                    {busy ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Sending
                        code
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep("identifier");
                    setCode("");
                    setError(null);
                  }}
                  className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-paper-dim hover:text-volt"
                >
                  <ArrowLeft size={15} /> Change{" "}
                  {channel === "phone" ? "number" : "email"}
                </button>
                <p className="text-xs font-semibold uppercase text-volt">
                  One final step
                </p>
                <h2 className="display mt-2 text-4xl sm:text-5xl">
                  Enter your code.
                </h2>
                <p className="mt-3 text-sm leading-6 text-paper-dim">
                  We sent a 6-digit code to{" "}
                  <strong className="font-semibold text-paper">
                    {identifier}
                  </strong>
                  .
                </p>

                <form
                  className="mt-8"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitOtp();
                  }}
                >
                  <label
                    htmlFor="otp"
                    className="mb-2 block text-xs font-semibold text-paper-dim"
                  >
                    6-digit code
                  </label>
                  <div className="flex h-15 items-center gap-3 border border-paper/25 bg-white px-4 transition-colors focus-within:border-volt focus-within:ring-1 focus-within:ring-volt">
                    <KeyRound size={18} className="shrink-0 text-paper-dim" />
                    <input
                      id="otp"
                      ref={otpRef}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      placeholder="000000"
                      className="min-w-0 flex-1 bg-transparent text-center font-mono text-2xl outline-none placeholder:text-paper-dim/30"
                    />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-paper-dim">
                    <Clock3 size={13} /> Code expires in 10 minutes.
                  </p>

                  <button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className={cn(
                      "mt-5 flex h-13 w-full items-center justify-center gap-2 text-sm font-semibold transition-colors",
                      busy || code.length !== 6
                        ? "cursor-not-allowed bg-ink-3 text-paper-dim"
                        : "bg-volt text-white hover:bg-paper",
                    )}
                  >
                    {busy ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Verifying
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Verify and sign in
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 flex justify-end text-xs">
                  <button
                    type="button"
                    disabled={resendIn > 0 || busy}
                    onClick={() => void sendOtp()}
                    className={cn(
                      "font-semibold",
                      resendIn > 0
                        ? "cursor-not-allowed text-paper-dim"
                        : "text-volt hover:text-paper",
                    )}
                  >
                    {resendIn > 0
                      ? `Resend available in ${resendIn}s`
                      : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border-l-2 border-blood bg-blood/5 px-3 py-2.5 text-sm text-blood"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <div className="mt-8 border-t border-paper/10 pt-5 text-center text-xs leading-5 text-paper-dim">
            <p>New to HyraLuxe? Your account is created automatically.</p>
            <p className="mt-1">
              By continuing, you agree to our{" "}
              <Link
                href="/policies/terms"
                className="underline hover:text-volt"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/policies/privacy"
                className="underline hover:text-volt"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-svh place-items-center">
          <Loader2 size={24} className="animate-spin text-volt" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
