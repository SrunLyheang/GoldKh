"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-runs the server-rendered dashboard on an interval so the price, P&L,
// and chart stay current without the user clicking Refresh — getPrice()'s
// own 5-minute staleness check still decides whether this actually calls
// goldapi.io or just re-reads the cache, so polling faster than that just
// picks up a cache hit most of the time.
const POLL_INTERVAL_MS = 60_000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
