"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";

// Calls POST /api/price/refresh, which bypasses getPrice()'s 30-minute
// cache and fetches goldapi.io directly — a plain router.refresh() alone
// almost always just re-rendered identical cached numbers, which read as
// broken. The route enforces a 10-minute cooldown (shared, not
// per-user); canManualRefresh mirrors that cooldown so the button starts
// disabled instead of letting the user click into a guaranteed 429.
export function RefreshButton({
  canManualRefresh,
}: {
  canManualRefresh: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  async function handleClick() {
    setMessage(null);

    let res: Response;
    try {
      res = await fetch("/api/price/refresh", { method: "POST" });
    } catch {
      setMessage("Couldn't reach the server — try again shortly.");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setMessage(
        body?.error?.message ?? "Couldn't refresh the price — try again shortly."
      );
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setMessage("Refreshed");
  }

  const disabled = isPending || !canManualRefresh;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        title={!canManualRefresh ? "Refreshed recently" : undefined}
        onClick={handleClick}
      >
        {isPending ? <Spinner size="xs" /> : <RefreshCw className="h-4 w-4" />}
        Refresh
      </Button>
      {message && (
        <span className="text-[11.5px] text-muted-foreground">{message}</span>
      )}
    </div>
  );
}
