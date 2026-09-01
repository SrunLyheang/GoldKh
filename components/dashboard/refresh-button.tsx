"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { requestPriceRefresh } from "@/lib/price/requestPriceRefresh";
import { notify } from "@/lib/ui/toast";

function minutesFromMs(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}

// Drives a manual price refresh. requestPriceRefresh() owns the wire
// contract with POST /api/price/refresh and classifies the result into
// one of four outcomes (see CONTEXT.md "manual refresh outcome"); this
// component maps each outcome to a toast (via the shared `notify`) and
// local state. The route enforces a shared 5-minute cooldown and hands
// the deadline back, so the button greys out and re-enables itself
// locally instead of only failing after a click. It stays clickable
// while greyed out on purpose: a click during cooldown is what surfaces
// the "please wait" toast.
export function RefreshButton({
  cooldownEndsAt: initialCooldownEndsAt,
  marketClosed = false,
}: {
  cooldownEndsAt: number | null;
  // True on weekends — the route would only reject the fetch, so the
  // button greys out and a click explains why instead of hitting it.
  marketClosed?: boolean;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [cooldownEndsAt, setCooldownEndsAt] = useState(initialCooldownEndsAt);
  const [inCooldown, setInCooldown] = useState(initialCooldownEndsAt !== null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The button spins for both phases of a refresh: the provider fetch
  // (isRefreshing, set synchronously on click so feedback is instant) and
  // the RSC re-render that follows (isPending). Without the first half the
  // button looks idle for the ~1-2s the goldapi.io call takes, so users
  // click again — each extra click firing another POST.
  const busy = isRefreshing || isPending;

  // Flips inCooldown off once cooldownEndsAt passes — never turns it on,
  // that only happens from the click handler (a real event, not a
  // render-time effect). The timeout fires at 0ms rather than calling
  // setState directly in the effect body, so the "is it already expired"
  // check stays async like every other transition here.
  useEffect(() => {
    const msLeft = cooldownEndsAt === null ? 0 : cooldownEndsAt - Date.now();
    const timeout = setTimeout(() => setInCooldown(false), Math.max(msLeft, 0));
    return () => clearTimeout(timeout);
  }, [cooldownEndsAt]);

  async function handleClick() {
    // Already fetching — the button is spinning and disabled; swallow the
    // click rather than firing a second POST.
    if (isRefreshing) return;

    if (marketClosed) {
      notify.error(t.refresh.marketClosed);
      return;
    }

    if (inCooldown && cooldownEndsAt) {
      notify.error(
        t.refresh.pleaseWait(minutesFromMs(cooldownEndsAt - Date.now()))
      );
      return;
    }

    // Synchronous, before the await, so the spinner and disabled state
    // land on this same click rather than only after the fetch resolves.
    setIsRefreshing(true);
    try {
      const outcome = await requestPriceRefresh();
      switch (outcome.kind) {
        case "unreachable":
          notify.error(t.refresh.couldntReach);
          return;
        case "failed":
          notify.error(outcome.message ?? t.refresh.couldntRefresh);
          return;
        case "cooldown":
          // outcome.cooldownEndsAt is already an absolute deadline (the
          // module anchored the Retry-After duration to when it arrived).
          if (outcome.cooldownEndsAt !== null) {
            setCooldownEndsAt(outcome.cooldownEndsAt);
            setInCooldown(true);
          }
          notify.error(outcome.message ?? t.refresh.couldntRefresh);
          return;
        case "marketClosed":
          notify.error(t.refresh.marketClosed);
          return;
        case "refreshed":
          setCooldownEndsAt(outcome.cooldownEndsAt);
          setInCooldown(outcome.cooldownEndsAt !== null);
          // Hand off to isPending: router.refresh() keeps the button
          // spinning through the RSC re-render with no visible gap.
          startTransition(() => {
            router.refresh();
          });
          notify.success(t.refresh.refreshed);
          return;
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  // Magnetic is a no-op on touch / reduced-motion (it self-gates), so the
  // button keeps its plain behaviour there.
  return (
    <Magnetic strength={10}>
      <Button
        variant="secondary"
        size="sm"
        aria-disabled={busy || inCooldown || marketClosed}
        className={cn(
          "border-(--glass-border-to) bg-(--glass-bg) hover:bg-(--glow-color)",
          (busy || inCooldown || marketClosed) && "opacity-50",
        )}
        title={
          marketClosed
            ? t.refresh.marketClosed
            : inCooldown
              ? t.refresh.refreshedRecently
              : undefined
        }
        onClick={handleClick}
      >
        {busy ? <Spinner size="xs" /> : <RefreshCw className="h-4 w-4" />}
        <span className="tt-label text-[11.5px]">{t.refresh.label}</span>
      </Button>
    </Magnetic>
  );
}
