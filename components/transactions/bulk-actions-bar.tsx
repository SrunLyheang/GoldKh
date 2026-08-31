"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Appears only while at least one row is selected. Layout is up to the
// caller (sticky footer on the full transactions page, inline strip on
// the compact dashboard panel) — this just renders the count and the two
// actions. Inline English copy: locale is en-only and dictionary.ts is
// frozen for this phase.
export function BulkActionsBar({
  count,
  onClear,
  onDelete,
  className,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2",
        className
      )}
    >
      <span className="tt-label text-[11px] text-muted-foreground">
        {count} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="tt-label text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="tt-label inline-flex items-center gap-1 border border-destructive px-2.5 py-1.5 text-[10.5px] text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
