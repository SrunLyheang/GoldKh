import { cn } from "@/lib/utils"

const SPINNER_SIZES = {
  xs: "h-3 w-3 border-[1.5px]",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const

// The one loading primitive for the app — a ring that spins to the gold
// accent, built from existing tokens (--border, --primary) rather than a
// new color, per code-standards.md's "no hardcoded hex" rule. Anything
// that needs a loading state (a submit button, a full-page loading.tsx)
// composes this instead of inventing its own spinner or disabled-text
// treatment.
export function Spinner({
  size = "sm",
  className,
}: {
  size?: keyof typeof SPINNER_SIZES
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-border border-t-primary",
        SPINNER_SIZES[size],
        className
      )}
    />
  )
}

// Full-section/page loading state — centers a larger Spinner with an
// optional label. Used for Next.js route-level `loading.tsx` boundaries
// and any other "the whole area isn't ready yet" case.
export function LoadingScreen({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] w-full flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
    </div>
  )
}
