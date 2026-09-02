"use client";

import { Check, ChevronsUpDown } from "lucide-react";

import { THEMES, useTheme, type ThemeId } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// A tiny live mockup of a theme, painted entirely from that theme's own
// tokens: the wrapper carries `data-theme={id}`, and every globals.css
// theme block is written as `:root[data-theme="x"], [data-theme="x"]`,
// so a nested element resolves the full token set. Nothing here hardcodes
// a colour — add a theme in globals.css and its swatch is automatically
// correct. The inner panel carries `.glass-surface` so the frosted fill,
// gradient-border ring and ambient shadow preview per theme too.
function ThemeSwatch({ id }: { id: ThemeId }) {
  return (
    <div
      data-theme={id}
      className="flex h-14 items-stretch gap-1.5 overflow-hidden bg-background p-2"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div
        className="glass-surface flex flex-1 flex-col justify-between p-1.5"
        style={{ borderRadius: "calc(var(--glass-radius) * 0.6)" }}
      >
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="h-1 w-5 rounded-full bg-foreground/70" />
        </div>
        <span className="h-1 w-8 rounded-full bg-muted-foreground/50" />
        <span className="h-1 w-6 rounded-full bg-muted-foreground/40" />
      </div>
      <div
        className="w-3 border border-border bg-primary"
        style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
      />
    </div>
  );
}

// Registry-driven theme picker. Replaces the old SegmentedControl /
// Select: with six themes a plain list doesn't communicate what each one
// looks like, so this is a popover of live preview swatches instead.
// DESIGN.md's Theming section documents the contract.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const active = THEMES.find((entry) => entry.id === theme) ?? THEMES[0];

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Theme"
        className={cn(
          "tt-label inline-flex items-center gap-2 rounded-md border border-border bg-accent/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-background ring-1 ring-border" />
          <span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />
        </span>
        {active.label}
        <ChevronsUpDown className="h-3 w-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="tt-label px-1 pb-1.5 pt-0.5 text-[11px] text-muted-foreground">
          Theme
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {THEMES.map((entry) => {
            const selected = entry.id === theme;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTheme(entry.id)}
                aria-pressed={selected}
                className={cn(
                  "group rounded-lg border p-1.5 text-left transition-colors",
                  selected
                    ? "border-primary bg-accent"
                    : "border-border hover:border-muted-foreground/40 hover:bg-accent/50",
                )}
              >
                <ThemeSwatch id={entry.id} />
                <span className="mt-1.5 flex items-center justify-between px-0.5">
                  <span
                    className={cn(
                      "tt-label text-[11px]",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {entry.label}
                  </span>
                  {selected && <Check className="h-3 w-3 text-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
