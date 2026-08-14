"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/format";

interface LiveRefreshOptions {
  intervalMs?: number;
}

export function useAdminLiveRefresh(
  load: () => Promise<void>,
  { intervalMs = 10_000 }: LiveRefreshOptions = {},
) {
  const loadRef = useRef(load);
  const inFlight = useRef(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      await loadRef.current();
      setLastUpdated(new Date());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Live sync failed.");
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, intervalMs);
    const syncNow = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", syncNow);
    window.addEventListener("online", syncNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener("online", syncNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, refresh]);

  return { error, lastUpdated, refresh, refreshing };
}

export function LiveRefreshStatus({
  error,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const age = lastUpdated ? Math.max(0, Math.floor((now - lastUpdated.getTime()) / 1000)) : null;
  const ageLabel = age === null ? "Connecting" : age < 5 ? "Just updated" : age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;

  return (
    <div className="flex h-9 items-center border border-paper/15 bg-ink-2" aria-live="polite">
      <div
        className={cn(
          "flex items-center gap-1.5 border-r border-paper/10 px-3 text-xs",
          error ? "text-blood" : "text-paper-dim",
        )}
        title={error ?? "Admin data refreshes automatically"}
      >
        {error ? <WifiOff size={14} /> : <Wifi size={14} className="text-volt" />}
        <span className="font-semibold text-paper">{error ? "Sync issue" : "Live"}</span>
        <span className="hidden sm:inline">{error ? "Retrying" : ageLabel}</span>
      </div>
      <button
        type="button"
        onClick={() => void onRefresh()}
        disabled={refreshing}
        className="grid h-full w-9 place-items-center text-paper-dim transition-colors hover:bg-ink-3 hover:text-paper disabled:opacity-50"
        aria-label="Refresh admin data"
        title="Refresh now"
      >
        <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
      </button>
    </div>
  );
}

export function AdminPageHeader({
  title,
  count,
  live,
  actions,
}: {
  title: string;
  count?: number;
  live: ReturnType<typeof useAdminLiveRefresh>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="display text-3xl sm:text-4xl">
        {title}<span className="text-volt">.</span>{" "}
        {count !== undefined && <span className="text-base text-paper-dim">({count})</span>}
      </h1>
      <div className="flex items-center gap-2">
        {actions}
        <LiveRefreshStatus
          error={live.error}
          lastUpdated={live.lastUpdated}
          onRefresh={live.refresh}
          refreshing={live.refreshing}
        />
      </div>
    </div>
  );
}
