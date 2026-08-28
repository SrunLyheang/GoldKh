"use client";

import { cn } from "@/lib/utils";
import { useLandingTheme } from "./landing-theme";

// Two-state light/dark switch for the marketing page. Icons are drawn
// inline (no icon dependency): a filled sun disc with rays when the
// page is light, a crescent when it's dark — each shows the theme you
// are currently in, and the button label says where a press takes you.
export function LandingThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      {isDark ? <MoonMark /> : <SunMark />}
    </button>
  );
}

function SunMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4a0.9 0.9 0 0 0-1.2-1A9.6 9.6 0 1 0 21 15.7a0.9 0.9 0 0 0-1-1.2Z" />
    </svg>
  );
}
