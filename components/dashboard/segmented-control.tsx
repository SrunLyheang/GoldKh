"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

// Used by UnitToggle — a generic segmented-control shape (role="group",
// pressed-state styling, sizing) kept separate from its options so a
// future style change, or a second toggle, has one place to land.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-accent/60 p-0.5",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "tt-label px-2.5 py-1 text-[10.5px] transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
