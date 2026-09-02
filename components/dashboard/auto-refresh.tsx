"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { MANUAL_REFRESH_COOLDOWN_MS } from "@/lib/constants/staleness";
import { isMarketOpen } from "@/lib/price/marketHours";

// Re-runs the server-rendered dashboard when the user returns to the tab after
// it's been hidden (switched away, minimized), so the price, P&L, and chart
// aren't stale on return — but only when it's been at least
// MANUAL_REFRESH_COOLDOWN_MS since the loaded price was captured, so flicking
// between tabs doesn't spam refreshes. There is no background interval: a
// hidden tab costs nothing. getPrice()'s own 30-minute staleness check still
// decides whether a refresh actually calls goldapi.io or just re-reads the
// cached snapshot.
export function AutoRefresh({ capturedAt }: { capturedAt: Date }) {
  const router = useRouter();
  const lastRefreshAtRef = useRef(0);
  // A primitive, so the effect re-subscribes only when the snapshot timestamp
  // actually changes — not on every router.refresh() that hands back a fresh
  // Date instance for the same moment.
  const capturedAtMs = capturedAt.getTime();

  useEffect(() => {
    lastRefreshAtRef.current = capturedAtMs;

    function refreshNow() {
      lastRefreshAtRef.current = Date.now();
      router.refresh();
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      // The spot market is closed (weekend): the price can't have moved, so a
      // refresh would only re-fetch the same snapshot and re-render the chart.
      // A tab left open across the weekend picks Monday's price back up because
      // isMarketOpen() is re-checked live on each tab re-entry.
      if (!isMarketOpen(new Date(Date.now()))) return;
      if (Date.now() - lastRefreshAtRef.current < MANUAL_REFRESH_COOLDOWN_MS) {
        return;
      }
      refreshNow();
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router, capturedAtMs]);

  return null;
}
