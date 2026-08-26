"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { MANUAL_REFRESH_COOLDOWN_MS } from "@/lib/constants/staleness";

function minutesFromMs(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}

// Calls POST /api/price/refresh, which bypasses getPrice()'s 30-minute
// cache and fetches goldapi.io directly. The route enforces a 5-minute
// cooldown (shared, not per-user) — cooldownEndsAt mirrors that so the
// button greys out and re-enables itself locally instead of only failing
// after a click. The button stays clickable while greyed out on
// purpose: a click during cooldown is what surfaces the "please wait"
// toast rather than doing nothing.
export function RefreshButton({
  cooldownEndsAt: initialCooldownEndsAt,
}: {
  cooldownEndsAt: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cooldownEndsAt, setCooldownEndsAt] = useState(initialCooldownEndsAt);
  const [inCooldown, setInCooldown] = useState(initialCooldownEndsAt !== null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

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

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(timeout);
  }, [toast]);

  function showToast(text: string) {
    setToast({ text, key: Date.now() });
  }

  async function handleClick() {
    if (inCooldown && cooldownEndsAt) {
      showToast(`Please wait ${minutesFromMs(cooldownEndsAt - Date.now())} minutes`);
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/price/refresh", { method: "POST" });
    } catch {
      showToast("Couldn't reach the server — try again shortly");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (res.status === 429) {
        setCooldownEndsAt(Date.now() + MANUAL_REFRESH_COOLDOWN_MS);
        setInCooldown(true);
      }
      showToast(
        body?.error?.message ?? "Couldn't refresh the price — try again shortly"
      );
      return;
    }

    setCooldownEndsAt(Date.now() + MANUAL_REFRESH_COOLDOWN_MS);
    setInCooldown(true);
    startTransition(() => {
      router.refresh();
    });
    showToast("Refreshed");
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        aria-disabled={inCooldown}
        className={inCooldown ? "opacity-50" : undefined}
        title={inCooldown ? "Refreshed recently" : undefined}
        onClick={handleClick}
      >
        {isPending ? <Spinner size="xs" /> : <RefreshCw className="h-4 w-4" />}
        Refresh
      </Button>
      {toast && (
        <div
          key={toast.key}
          className="pointer-events-none fixed top-1/2 left-1/2 z-50 animate-toast-float-up rounded-lg border border-border bg-card px-4 py-2.5"
        >
          <p className="text-[12.5px] font-medium text-foreground">{toast.text}</p>
        </div>
      )}
    </>
  );
}
