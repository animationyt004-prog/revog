"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
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
    if (status === "guest") router.replace("/login");
    else if (status === "authed" && user?.role !== "ADMIN") router.replace("/");
  }, [status, user?.role, router]);

  if (!isAdmin) {
    return (
      <main className="grid min-h-svh place-items-center">
        <Loader2 size={28} className="animate-spin text-volt" />
      </main>
    );
  }

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="flex w-16 shrink-0 flex-col border-r border-paper/10 bg-ink-2 sm:w-56">
        <Link href="/admin" className="display border-b border-paper/10 p-4 text-xl leading-none">
          <span className="hidden sm:inline">REVOG</span>
          <span className="sm:hidden">R</span>
          <span className="text-volt">.</span>
          <span className="mt-1 hidden text-[10px] tracking-[0.3em] text-paper-dim sm:block">
            CONTROL ROOM
          </span>
        </Link>
        <nav className="flex-1 py-3">
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
                  "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                  active
                    ? "border-r-2 border-volt bg-volt/10 font-semibold text-volt"
                    : "text-paper-dim hover:bg-ink-3 hover:text-paper",
                )}
              >
                <item.icon size={17} className="shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="flex items-center gap-2 border-t border-paper/10 px-5 py-3.5 text-xs text-paper-dim hover:text-paper"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back to store</span>
        </Link>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
          <p className="text-xs text-paper-dim">
            Signed in as <strong className="text-paper">{user?.email}</strong> · ADMIN
          </p>
        </header>
        <main className="p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
