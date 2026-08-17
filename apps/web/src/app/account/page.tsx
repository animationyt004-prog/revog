"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { AccountTabs } from "@/components/account/account-tabs";
import { AccountLoadingScreen } from "@/components/account/account-session";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { amp } from "@/components/typography";
import { authedFetch, useAuth } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";
import { orderHref } from "@/lib/order-link";
import type { OrderData } from "@/lib/types";

interface AccountReturn {
  id: string;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "border-volt/40 bg-volt/10 text-volt",
  PACKED: "border-volt/40 bg-volt/10 text-volt",
  SHIPPED: "border-paper/20 bg-ink-2 text-paper",
  DELIVERED: "border-paper/20 bg-ink-2 text-paper",
  CANCELLED: "border-blood/40 bg-blood/10 text-blood",
  RETURN_REQUESTED: "border-volt/40 bg-volt/10 text-volt",
};

const LINKS = [
  {
    icon: Package,
    label: "All orders",
    detail: "History & delivery tracking",
    href: "/account/orders",
  },
  {
    icon: RotateCcw,
    label: "Returns",
    detail: "Requests & refund progress",
    href: "/account/returns",
  },
  {
    icon: Heart,
    label: "Wishlist",
    detail: "Sarees saved for later",
    href: "/wishlist",
  },
  {
    icon: MapPin,
    label: "Saved addresses",
    detail: "Delivery details for checkout",
    href: "/account/addresses",
  },
];

export default function AccountPage() {
  const router = useRouter();
  // Subscribed field by field, the way every other store consumer here does
  // it. Destructuring the whole store hands the component a fresh object on
  // every unrelated change and makes what it re-renders on much harder to
  // reason about — and this screen's whole job is reacting to one of them.
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const bootstrap = useAuth((s) => s.bootstrap);
  const logout = useAuth((s) => s.logout);
  const updateProfile = useAuth((s) => s.updateProfile);
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [returns, setReturns] = useState<AccountReturn[] | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [sessionFailed, setSessionFailed] = useState(false);

  const sessionPending = status !== "authed" || !user;

  useEffect(() => {
    if (!sessionPending) {
      setSessionFailed(false);
      return;
    }
    const deadline = window.setTimeout(() => {
      if (useAuth.getState().status === "loading") {
        setSessionFailed(true);
        router.replace("/login?next=/account");
      }
    }, 10_000);
    return () => {
      window.clearTimeout(deadline);
    };
  }, [router, sessionPending]);

  useEffect(() => {
    if (status === "loading") void bootstrap();
  }, [bootstrap, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest" || !user) router.replace("/login?next=/account");
  }, [router, status, user]);

  const hasSession = status === "authed" && Boolean(user);
  const userName = user?.name ?? "";

  useEffect(() => {
    if (!hasSession) return;
    setName(userName);
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);

    void authedFetch("/orders", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: OrderData[]) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) setOrders([]);
      });

    void authedFetch("/returns", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: AccountReturn[]) => {
        if (active) setReturns(data);
      })
      .catch(() => {
        if (active) setReturns([]);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
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
    return <AccountLoadingScreen nextPath="/account" failed={sessionFailed} />;
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
  const displayName = user.name?.trim() || "HyraLuxe Member";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <PromoTicker />
      <Navbar />

      <main className="flex-1 bg-ink">
        <section className="bg-night text-white">
          <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
            <p className="text-xs font-semibold uppercase text-gold">
              Private member account
            </p>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <span className="display grid h-16 w-16 shrink-0 place-items-center rounded-full border border-gold/40 bg-white/10 text-2xl">
                  {initial}
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
                        className="h-11 w-56 border border-white/25 bg-white px-3 text-sm text-paper outline-none focus:border-volt"
                        aria-label="Your name"
                        placeholder="Your name"
                      />
                      <button
                        type="button"
                        onClick={() => void saveName()}
                        disabled={saving}
                        aria-label="Save name"
                        title="Save name"
                        className="grid h-11 w-11 place-items-center bg-volt text-white disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Check size={18} />
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
                        className="grid h-11 w-11 place-items-center border border-white/20 text-white/65 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-2">
                      <h1 className="display truncate text-3xl sm:text-5xl">
                        {displayName}
                        <span className="text-volt">.</span>
                      </h1>
                      <button
                        type="button"
                        onClick={() => setEditingName(true)}
                        aria-label="Edit name"
                        title="Edit name"
                        className="grid h-9 w-9 shrink-0 place-items-center text-white/55 hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 truncate text-sm text-white/60">
                    {user.email ?? user.phone}
                  </p>
                  {profileError && (
                    <p className="mt-1 text-xs text-red-300" role="alert">
                      {profileError}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => void logout().then(() => router.replace("/"))}
                className="flex h-10 items-center gap-2 border border-white/20 px-4 text-sm text-white/65 transition-colors hover:border-white/50 hover:text-white"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>

            <div className="mt-10 grid border-t border-white/10 sm:grid-cols-3">
              {[
                ["Active orders", orders === null ? "-" : String(activeOrders)],
                ["Open returns", returns === null ? "-" : String(openReturns)],
                [
                  "Order value",
                  orders === null ? "-" : formatPrice(totalSpent),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-white/10 py-5 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0"
                >
                  <p className="text-xs text-white/50">{label}</p>
                  <p className="display mt-1 text-3xl">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AccountTabs />
          <div className="grid gap-10 py-9 lg:grid-cols-[1.55fr_0.8fr] lg:py-12">
            <section>
              <div className="flex items-end justify-between gap-4 border-b border-paper/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-volt">
                    Purchase history
                  </p>
                  <h2 className="display mt-1 text-3xl">Recent orders</h2>
                </div>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-1 text-xs font-semibold text-paper-dim hover:text-volt"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {orders === null ? (
                <div className="grid place-items-center py-16">
                  <Loader2 size={23} className="animate-spin text-volt" />
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <Package
                    size={38}
                    strokeWidth={1.2}
                    className="mx-auto text-paper-dim"
                  />
                  <p className="display mt-4 text-2xl">
                    Your first order awaits.
                  </p>
                  <Link
                    href="/collections/sarees"
                    className="mt-4 inline-flex h-11 items-center bg-volt px-5 text-sm font-semibold text-white"
                  >
                    Explore sarees
                  </Link>
                </div>
              ) : (
                <div>
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      href={orderHref(order, user.email)}
                      className="group grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-paper/10 py-4"
                    >
                      <div className="relative aspect-[3/4] w-13 overflow-hidden bg-ink-2">
                        {order.items[0]?.image && (
                          <Image
                            src={order.items[0].image}
                            alt=""
                            fill
                            sizes="52px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-volt">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-paper-dim">
                          {new Date(order.placedAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}{" "}
                          · {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 inline-block border px-2 py-0.5 text-[10px] font-semibold",
                            STATUS_STYLE[order.status] ??
                              "border-paper/20 text-paper-dim",
                          )}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(order.total)}
                        </p>
                        <ArrowRight
                          size={15}
                          className="ml-auto mt-2 text-paper-dim transition-transform group-hover:translate-x-1 group-hover:text-volt"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <aside>
              <p className="text-xs font-semibold uppercase text-volt">
                Member services
              </p>
              <h2 className="display mt-1 border-b border-paper/10 pb-3 text-3xl">
                Your account
              </h2>
              <div>
                {LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 border-b border-paper/10 py-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-ink-2 text-volt">
                      <item.icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold group-hover:text-volt">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-paper-dim">
                        {amp(item.detail)}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="text-paper-dim transition-transform group-hover:translate-x-1 group-hover:text-volt"
                    />
                  </Link>
                ))}
              </div>
              <div className="mt-7 border-l-2 border-volt bg-ink-2 px-4 py-3">
                <p className="text-xs font-semibold">
                  Need help with an order?
                </p>
                <Link
                  href="/contact"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-volt hover:text-paper"
                >
                  Contact support <ArrowRight size={13} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
