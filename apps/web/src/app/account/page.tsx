"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Loader2,
  LogOut,
  Package,
  Pencil,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { formatPrice } from "@/lib/format";
import type { OrderData } from "@/lib/types";

interface AccountReturn {
  id: string;
  status: string;
  refundAmount: number | null;
}

const ACCOUNT_LINKS = [
  {
    icon: Package,
    label: "Orders",
    blurb: "Track deliveries and order history",
    href: "/account/orders",
  },
  {
    icon: RotateCcw,
    label: "Returns",
    blurb: "Follow requests and refunds",
    href: "/account/returns",
  },
  {
    icon: Heart,
    label: "Wishlist",
    blurb: "Your saved sarees",
    href: "/wishlist",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { status, user, bootstrap, logout, updateProfile } = useAuth();
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [returns, setReturns] = useState<AccountReturn[] | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [slowSession, setSlowSession] = useState(false);

  // Exactly the condition the spinner below renders on. These two used to
  // disagree: the spinner showed whenever there was no usable session, but the
  // escape hatch was armed only while status was literally "loading". A
  // session that came back "authed" with no user therefore span forever with
  // no buttons and no redirect — the state this page was reported stuck in.
  const sessionPending = status !== "authed" || !user;

  useEffect(() => {
    if (!sessionPending) {
      setSlowSession(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowSession(true), 4_000);
    return () => window.clearTimeout(timer);
  }, [sessionPending]);

  // Kept apart from the data fetch below so it depends on whether there is a
  // user at all, not on that user's name. Folded together, a session that lost
  // its user without changing the name would never re-run this and the page
  // would sit on the spinner instead of bouncing to sign-in.
  useEffect(() => {
    if (status === "loading") return;
    // "authed" without a user is not a session anyone can use; treat it the
    // same as being signed out rather than waiting on a user that will
    // never arrive.
    if (status === "guest" || !user) router.replace("/login?next=/account");
  }, [router, status, user]);

  // Depends on the two facts it actually uses rather than the user object, so
  // a re-issued token with identical details does not refetch the lists.
  const hasSession = status === "authed" && Boolean(user);
  const userName = user?.name ?? "";

  useEffect(() => {
    if (!hasSession) return;
    setName(userName);
    void Promise.all([
      authedFetch("/orders").then((res) => (res.ok ? res.json() : [])),
      authedFetch("/returns").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([orderData, returnData]) => {
        setOrders(orderData as OrderData[]);
        setReturns(returnData as AccountReturn[]);
      })
      .catch(() => {
        setOrders([]);
        setReturns([]);
      });
  }, [hasSession, userName]);

  async function saveName() {
    if (name.trim().length < 2) {
      setProfileError("Enter at least 2 characters.");
      return;
    }
    setSaving(true);
    setProfileError(null);
    try {
      await updateProfile(name);
      setEditingName(false);
    } catch (cause) {
      setProfileError(
        cause instanceof Error ? cause.message : "Could not save your name.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authed" || !user) {
    return (
      <main className="grid min-h-svh place-items-center px-5 text-center">
        <div>
          <Loader2 size={28} className="mx-auto animate-spin text-volt" />
          <p className="mt-4 text-sm font-semibold">Opening your account...</p>
          <p className="mt-1 text-xs text-paper-dim">
            Restoring your secure session.
          </p>
          {slowSession && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSlowSession(false);
                  void bootstrap();
                }}
                className="h-10 bg-volt px-4 text-sm font-semibold text-white"
              >
                Try again
              </button>
              <Link
                href="/login?next=/account"
                className="flex h-10 items-center border border-paper/20 px-4 text-sm font-semibold"
              >
                Sign in again
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  const activeOrders =
    orders?.filter(
      (order) => !["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status),
    ).length ?? 0;
  const totalSpent =
    orders
      ?.filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.total, 0) ?? 0;
  const openReturns =
    returns?.filter((item) => !["REFUNDED", "REJECTED"].includes(item.status))
      .length ?? 0;

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-paper/10 pb-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-volt text-white">
              <User size={25} />
            </span>
            <div className="min-w-0">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    maxLength={80}
                    onChange={(event) => {
                      setName(event.target.value);
                      setProfileError(null);
                    }}
                    className="h-10 w-56 border border-paper/25 bg-white px-3 text-sm outline-none focus:border-volt"
                    aria-label="Your name"
                    placeholder="Your name"
                  />
                  <button
                    type="button"
                    onClick={() => void saveName()}
                    disabled={saving}
                    aria-label="Save name"
                    title="Save name"
                    className="grid h-10 w-10 place-items-center bg-volt text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setName(user.name ?? "");
                      setProfileError(null);
                    }}
                    aria-label="Cancel editing"
                    title="Cancel"
                    className="grid h-10 w-10 place-items-center border border-paper/20 text-paper-dim hover:text-paper"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="display truncate text-3xl sm:text-4xl">
                    {user.name ?? "Add your name"}
                    <span className="text-volt">.</span>
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    aria-label="Edit name"
                    title="Edit name"
                    className="grid h-8 w-8 shrink-0 place-items-center text-paper-dim hover:text-volt"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              )}
              <p className="truncate text-sm text-paper-dim">
                {user.email ?? user.phone}
              </p>
              {profileError && (
                <p className="mt-1 text-xs text-blood" role="alert">
                  {profileError}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => void logout().then(() => router.replace("/"))}
            className="flex h-10 items-center gap-2 border border-paper/20 px-4 text-sm text-paper-dim transition-colors hover:border-blood hover:text-blood"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        <section className="grid border-b border-paper/10 sm:grid-cols-3">
          <div className="border-b border-paper/10 py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0">
            <p className="text-xs text-paper-dim">Active orders</p>
            <p className="display mt-1 text-3xl">
              {orders === null ? "-" : activeOrders}
            </p>
          </div>
          <div className="border-b border-paper/10 py-5 sm:border-b-0 sm:border-r sm:px-5">
            <p className="text-xs text-paper-dim">Open returns</p>
            <p className="display mt-1 text-3xl">
              {returns === null ? "-" : openReturns}
            </p>
          </div>
          <div className="py-5 sm:px-5">
            <p className="text-xs text-paper-dim">Order value</p>
            <p className="display mt-1 text-3xl">
              {orders === null ? "-" : formatPrice(totalSpent)}
            </p>
          </div>
        </section>

        <section className="mt-9">
          <h2 className="display text-2xl">Your account</h2>
          <div className="mt-4 grid gap-px border border-paper/10 bg-paper/10 md:grid-cols-3">
            {ACCOUNT_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-32 flex-col bg-ink p-5 transition-colors hover:bg-ink-2"
              >
                <item.icon size={21} className="text-volt" />
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div>
                    <h3 className="display text-xl">{item.label}</h3>
                    <p className="mt-1 text-xs text-paper-dim">{item.blurb}</p>
                  </div>
                  <ChevronRight
                    size={17}
                    className="shrink-0 text-paper-dim transition-transform group-hover:translate-x-1 group-hover:text-volt"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
