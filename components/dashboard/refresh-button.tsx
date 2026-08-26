"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  return (
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
  );
}
