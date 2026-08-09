"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { useAuth } from "@/lib/auth-store";

export function useAccountSession(nextPath: string) {
  const router = useRouter();
  const status = useAuth((state) => state.status);
  const user = useAuth((state) => state.user);
  const bootstrap = useAuth((state) => state.bootstrap);

  useEffect(() => {
    if (status === "loading") void bootstrap();
  }, [bootstrap, status]);

  useEffect(() => {
    if (status === "loading") {
      const deadline = window.setTimeout(() => {
        if (useAuth.getState().status === "loading") {
          router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        }
      }, 10_000);
      return () => window.clearTimeout(deadline);
    }

    if (status === "guest" || !user) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [nextPath, router, status, user]);

  return {
    ready: status === "authed" && Boolean(user),
    status,
    user,
  };
}

export function AccountLoadingScreen({
  nextPath,
  failed = false,
}: {
  nextPath: string;
  failed?: boolean;
}) {
  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="flex-1 bg-ink">
        <section className="border-b border-white/10 bg-night text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-gold">
              <LockKeyhole size={14} /> Private member account
            </p>
            <h1 className="display mt-4 max-w-3xl text-4xl sm:text-6xl">
              {failed
                ? "Let’s get you back in."
                : "Your account, beautifully organised."}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">
              {failed
                ? "Your secure session needs to be refreshed before we continue."
                : "We’re securely restoring your personal account and order history."}
            </p>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.4fr_0.75fr] lg:gap-16">
          <section aria-live="polite">
            <p className="text-xs font-semibold uppercase text-volt">
              Secure account access
            </p>
            <div className="mt-3 flex items-start gap-4 border-b border-paper/10 pb-7">
              {!failed && (
                <span className="grid h-12 w-12 shrink-0 place-items-center border border-volt/25 bg-volt/5 text-volt">
                  <Loader2 size={21} className="animate-spin" />
                </span>
              )}
              <div>
                <h2 className="display text-3xl">
                  {failed ? "Session refresh needed" : "Opening your account"}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-paper-dim">
                  {failed
                    ? "Sign in again with your secure one-time code to continue."
                    : "This normally takes only a moment. Your orders, returns and saved details will appear here."}
                </p>
              </div>
            </div>

            <div className="grid border-b border-paper/10 sm:grid-cols-3">
              {["Orders", "Returns", "Saved addresses"].map((label) => (
                <div
                  key={label}
                  className="border-b border-paper/10 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
                >
                  <p className="text-xs text-paper-dim">{label}</p>
                  <span className="mt-3 block h-2 w-20 bg-ink-3" />
                </div>
              ))}
            </div>
          </section>

          <aside className="border-l-2 border-gold bg-ink-2 px-5 py-6 sm:px-6">
            <ShieldCheck size={23} className="text-volt" />
            <h2 className="display mt-4 text-2xl">Private by design.</h2>
            <p className="mt-2 text-sm leading-6 text-paper-dim">
              Your account is protected with password-free one-time-code access.
            </p>
            <div className="mt-6 grid gap-2">
              <a
                href={nextPath}
                className="flex h-11 items-center justify-between bg-volt px-4 text-sm font-semibold text-white transition-colors hover:bg-paper"
              >
                Reload account <ArrowRight size={16} />
              </a>
              <a
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="flex h-11 items-center justify-between border border-paper/20 px-4 text-sm font-semibold transition-colors hover:border-volt hover:text-volt"
              >
                Sign in again <ArrowRight size={16} />
              </a>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

export function AccountSessionLoading({ nextPath }: { nextPath: string }) {
  return <AccountLoadingScreen nextPath={nextPath} />;
}
