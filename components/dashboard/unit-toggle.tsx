"use client";

import type { GoldUnit } from "@/lib/calc/units";
import { cn } from "@/lib/utils";

const UNITS: { value: GoldUnit; label: string }[] = [
  { value: "chi", label: "Chi" },
  { value: "damlung", label: "Damlung" },
];

// Single segmented control shared by the hero card, stat row, and
// transaction table — one source of truth for "which unit is the user
// looking at right now" instead of three independent toggles that could
// drift out of sync.
export function UnitToggle({
  value,
  onChange,
  className,
}: {
  value: GoldUnit;
  onChange: (unit: GoldUnit) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Display unit"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-accent/60 p-0.5",
        className
      )}
    >
      {UNITS.map((unit) => (
        <button
          key={unit.value}
          type="button"
          onClick={() => onChange(unit.value)}
          aria-pressed={value === unit.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors",
            value === unit.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {unit.label}
        </button>
      ))}
    </div>
  );
}
