"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

// A two-or-three way switch set into the page (a well, one step below the
// paper). The chosen option is a raised slip of paper with gold ink.
// Switched tens of times a day, so it changes colour only — no slide.
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
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-sunk p-1",
        className,
      )}
    >
      {options.map((option) => {
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={on}
            className={cn(
              "press inline-flex min-h-9 items-center rounded-md px-3 text-detail font-medium",
              on
                ? "bg-popover text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.18)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
