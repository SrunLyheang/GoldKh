import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "foreground" | "muted" | "gain" | "loss";

const TONE_CLASSES: Record<Tone, string> = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  gain: "text-state-gain",
  loss: "text-destructive",
};

// Every figure goes through here: tabular figures so columns line up,
// and an optional fixed-width sign cell so +/- figures align on the
// digit. (Named for the old monospace face; figures now use the reading
// face's tabular numerals — see DESIGN.md.)
export function MonoValue({
  className,
  tone = "foreground",
  signed = false,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; signed?: boolean }) {
  const base = cn("tabular-nums break-words", TONE_CLASSES[tone], className);

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
