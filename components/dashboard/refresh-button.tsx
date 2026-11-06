"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/dictionary";
import { requestPriceRefresh } from "@/lib/price/requestPriceRefresh";
import { notify } from "@/lib/ui/toast";

function minutesFromMs(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}

// Manual price refresh. requestPriceRefresh() owns the wire contract and
// classifies the result; this component maps each outcome to a toast + local
// state. The route's shared 5-minute cooldown deadline greys the button out
// locally, but it stays clickable so a click surfaces the "please wait" toast.
export function RefreshButton({
  cooldownEndsAt: initialCooldownEndsAt,
  marketClosed = false,
}: {
  cooldownEndsAt: number | null;
  // Weekends: the route would reject the fetch anyway, so grey out and
  // explain on click.
  marketClosed?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cooldownEndsAt, setCooldownEndsAt] = useState(initialCooldownEndsAt);
  const [inCooldown, setInCooldown] = useState(initialCooldownEndsAt !== null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Spin through both phases: the provider fetch (isRefreshing, set
  // synchronously so feedback is instant) and the RSC re-render (isPending).
  // Without the first, the button looks idle for ~1-2s and users re-click.
  const busy = isRefreshing || isPending;

  // Flips inCooldown off once the deadline passes; it's only ever turned on
  // from the click handler. Timeout (even at 0ms) keeps the check async.
  useEffect(() => {
    const msLeft = cooldownEndsAt === null ? 0 : cooldownEndsAt - Date.now();
    const timeout = setTimeout(() => setInCooldown(false), Math.max(msLeft, 0));
    return () => clearTimeout(timeout);
  }, [cooldownEndsAt]);

  async function handleClick() {
    // Already fetching — swallow the click rather than firing a second POST.
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

    // Before the await, so the spinner lands on this click, not after the fetch.
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
          // Already an absolute deadline (module anchored Retry-After on arrival).
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
          // isPending keeps the button spinning through the RSC re-render.
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

  // Magnetic self-gates to a no-op on touch / reduced-motion.
  return (
      <Button
        variant="ghost"
        size="sm"
        aria-disabled={busy || inCooldown || marketClosed}
        className={cn(
          "press -mr-2 min-h-11 gap-1.5 px-3 text-gold hover:bg-(--glow-color) hover:text-gold",
          (busy || inCooldown || marketClosed) && "cursor-not-allowed opacity-55",
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
        <span className="text-detail font-medium">{t.refresh.label}</span>
      </Button>
  );
}
