import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Every dashboard card is a `.glass-surface` (faux-frost fill +
// gradient-border ring + ambient shadow — see app/globals.css). `lg`
// panels (hero, chart) carry more padding so they read as the page's
// primary surface; `md` panels (stat cards, transaction rows) are
// tighter. `variant="accent"` tints the frost toward `--primary` for
// the gold-glass hero look. See DESIGN.md.
const SIZE_CLASSES = {
  lg: "glass-surface p-6 sm:p-8",
  md: "glass-surface p-5",
} as const;

export function Panel({
  className,
  size = "md",
  variant = "surface",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  size?: keyof typeof SIZE_CLASSES;
  variant?: "surface" | "accent";
}) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        variant === "accent" && "glass-surface--accent",
        className
      )}
      {...props}
    />
  );
}
