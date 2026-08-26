"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

// getPrice() only actually calls goldapi.io once its 5-minute cache is
// stale, so most clicks just re-render identical numbers — without this,
// the button looked broken even though it was doing a real round-trip.
// This confirms the click did something regardless of whether the price
// itself changed.
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    setJustRefreshed(true);
    const timeout = setTimeout(() => setJustRefreshed(false), 2000);
    return () => clearTimeout(timeout);
  }, [isPending]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setSpinning(true);
          startTransition(() => {
            router.refresh();
          });
          setTimeout(() => setSpinning(false), 600);
        }}
      >
        <RefreshCw className={spinning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Refresh
      </Button>
      {justRefreshed && (
        <span className="text-[11.5px] text-muted-foreground">Refreshed</span>
      )}
    </div>
  );
}
