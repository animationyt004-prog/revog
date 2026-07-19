"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/** Fires a PAGE_VIEW on every route change (and the first load). */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    track("PAGE_VIEW", { path: pathname });
  }, [pathname]);

  return null;
}
