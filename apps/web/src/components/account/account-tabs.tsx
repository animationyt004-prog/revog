"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, MapPin, Package, RotateCcw } from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { label: "Overview", href: "/account", icon: LayoutGrid },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Returns", href: "/account/returns", icon: RotateCcw },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="no-scrollbar flex overflow-x-auto border-b border-paper/10"
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/account"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-xs font-semibold transition-colors sm:px-5",
              active
                ? "border-volt text-volt"
                : "border-transparent text-paper-dim hover:text-paper",
            )}
          >
            <item.icon size={15} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
