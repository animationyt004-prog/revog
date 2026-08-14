"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  BarChart3,
  LayoutDashboard,
  Loader2,
  Package,
  RotateCcw,
  Shirt,
  Tag,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/format";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Traffic", href: "/admin/analytics", icon: BarChart3 },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Products", href: "/admin/products", icon: Shirt },
  { label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();

  const isAdmin = status === "authed" && user?.role === "ADMIN";

  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authed" && user?.role !== "ADMIN") router.replace("/");
  }, [pathname, status, user?.role, router]);

  if (!isAdmin) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Loader2 size={28} className="animate-spin text-volt" />
      </main>
    );
  }

  return (
    <div className="min-h-svh sm:flex">
      <aside className="sticky top-0 z-40 flex w-full shrink-0 border-b border-paper/10 bg-ink-2 sm:h-svh sm:w-56 sm:flex-col sm:border-b-0 sm:border-r">
        <Link href="/admin" className="display flex shrink-0 items-center border-r border-paper/10 px-4 py-3 text-xl leading-none sm:block sm:border-b sm:border-r-0 sm:p-4">
          <span>HYRA</span>
          <span className="text-volt">.</span>
          <span className="mt-1 hidden text-[10px] tracking-[0.3em] text-paper-dim sm:block">
            CONTROL ROOM
          </span>
        </Link>
        <nav className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto sm:block sm:overflow-visible sm:py-3">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs transition-colors sm:gap-3 sm:border-b-0 sm:px-5 sm:py-2.5 sm:text-sm",
                  active
                    ? "border-volt bg-volt/10 font-semibold text-volt sm:border-r-2"
                    : "border-transparent text-paper-dim hover:bg-ink-3 hover:text-paper",
                )}
              >
                <item.icon size={17} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="hidden items-center gap-2 border-t border-paper/10 px-5 py-3.5 text-xs text-paper-dim hover:text-paper sm:flex"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back to store</span>
        </Link>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="hidden items-center justify-between border-b border-paper/10 px-5 py-3 sm:flex">
          <p className="text-xs text-paper-dim">
            Signed in as <strong className="text-paper">{user?.email}</strong> · ADMIN
          </p>
        </header>
        <main className="p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
