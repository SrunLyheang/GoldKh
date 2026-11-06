"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

// The lamp switch: Night (the default) or Day. A real switch with a
// visible label, not a picker — there are only two designed themes.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDay = theme === "day";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDay}
      aria-label="Day theme"
      onClick={() => setTheme(isDay ? "night" : "day")}
      className={cn(
        "press inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-detail text-muted-foreground hover:text-foreground",
        className,
      )}
      title={isDay ? "Switch to Night" : "Switch to Day"}
    >
      {isDay ? (
        <Sun className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-gold" strokeWidth={1.75} aria-hidden="true" />
      )}
      <span>{isDay ? "Day" : "Night"}</span>
    </button>
  );
}
