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
// DESIGN.md's Typography section.
//
// `signed` splits a leading +/- (or nothing) into its own fixed-width
// cell so "-$285.00" and "$285.00" align on the first digit — the
// "Negative gain/loss alignment" item from DESIGN.md. Only applies
// when `children` is a string; anything else renders unchanged.
export function MonoValue({
  className,
  tone = "foreground",
  signed = false,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; signed?: boolean }) {
  // `break-words`, not `break-all`: a formatted figure ("-$1,234.56") has
  // no mid-string break opportunities, so it stays on one line and the
  // parent handles any overflow (CountUpValue / PnlRollingFigure clip it
  // in a fixed-width grid cell). `break-all` used to let a number wrap
  // between any two digits in a tight column.
  const base = cn("font-mono tabular-nums break-words", TONE_CLASSES[tone], className);

  if (signed && typeof children === "string") {
    const sign = children[0] === "-" || children[0] === "+" ? children[0] : "";
    const rest = sign ? children.slice(1) : children;
    return (
      <span className={base} {...props}>
        <span data-sign-cell className="inline-block w-[0.6em] text-right">
          {sign}
        </span>
        {rest}
      </span>
    );
  }

  return (
    <span className={base} {...props}>
      {children}
    </span>
  );
}
