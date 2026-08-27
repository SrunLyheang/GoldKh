import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The `[ LABEL ]` bracket framing the dashboard already uses on its
// hero dot and section headings (see hero-price-card.tsx,
// context/progress-tracker.md's Industrial Brutalism entry), pulled
// into one place for the landing page's section eyebrows.
export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("tt-label text-[11px] text-primary", className)}>
      <span aria-hidden>[ </span>
      {children}
      <span aria-hidden> ]</span>
    </p>
  );
}
