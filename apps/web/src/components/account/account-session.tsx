"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
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

export function AccountSessionLoading({ nextPath }: { nextPath: string }) {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-5 text-center">
      <div>
        <p className="display text-2xl">
          HYRALUXE<span className="text-volt">.</span>
        </p>
        <Loader2 size={24} className="mx-auto mt-6 animate-spin text-volt" />
        <p className="mt-4 text-sm font-semibold">Opening your account</p>
        <p className="mt-1 text-xs text-paper-dim">
          Restoring your secure session.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a
            href={nextPath}
            className="flex h-10 items-center bg-volt px-4 text-sm font-semibold text-white"
          >
            Reload account
          </a>
          <a
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="flex h-10 items-center border border-paper/20 px-4 text-sm font-semibold hover:border-volt hover:text-volt"
          >
            Sign in again
          </a>
        </div>
      </div>
    </main>
  );
}
