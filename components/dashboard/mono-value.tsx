import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "foreground" | "muted" | "gain" | "loss";

const TONE_CLASSES: Record<Tone, string> = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  gain: "text-state-gain",
  loss: "text-destructive",
};

// Every price, quantity, cost basis, and gain/loss figure uses this —
// mono tabular figures so columns of numbers line up. See
// context/ui-context.md's Typography section.
export function MonoValue({
  className,
  tone = "foreground",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums break-all",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
