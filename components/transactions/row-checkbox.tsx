"use client";

import { cn } from "@/lib/utils";

// Native checkbox for the transaction list's multi-select. Shared by the
// desktop table, the mobile cards, and the select-all header on both
// surfaces so they can't drift. `stopPropagation` on the wrapper keeps a
// tick from also toggling the row's expander.
export function RowCheckbox({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn("-m-1.5 inline-flex items-center p-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheckedChange}
        aria-label={label}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    </span>
  );
}
