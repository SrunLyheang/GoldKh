import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Small label that sits above a section title. The editorial "Assay"
// landing treatment keeps eyebrows quiet — mono, uppercase, wide
// tracking, muted — with no bracket framing (that stays the dashboard's
// Vault idiom). See context/progress-tracker.md.
export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}
