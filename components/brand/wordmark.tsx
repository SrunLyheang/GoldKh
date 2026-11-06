import { cn } from "@/lib/utils";

// GoldKh's mark: the name in the ledger serif and, beside it, the Khmer
// word for gold — មាស (meas) — stamped in gold like the name on a shop's
// receipt book. The Khmer is decorative here (aria-hidden) because the
// link around the mark carries the accessible name.
export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-serif font-semibold tracking-tight text-foreground",
        size === "lg" ? "text-figure-lg" : "text-figure",
        className,
      )}
    >
      GoldKh
      <span
        aria-hidden="true"
        className={cn(
          "font-sans font-semibold text-gold",
          size === "lg" ? "text-figure" : "text-body",
        )}
        style={{ fontFamily: "var(--font-khmer)" }}
      >
        មាស
      </span>
    </span>
  );
}
