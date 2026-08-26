import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// `lg` panels (hero, chart) carry a border and a tinted shadow so they
// read as the page's primary surface. `md` panels (stat cards,
// transaction rows) drop the border and lean on a lighter shadow instead
// — flat border+shadow on every card was making the dashboard feel like
// one repeated container rather than a hierarchy. See context/ui-context.md.
const SIZE_CLASSES = {
  lg: "border border-border p-5 shadow-vault-lg sm:p-7",
  md: "border border-border p-5 shadow-vault-sm",
} as const;

export function Panel({
  className,
  size = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: keyof typeof SIZE_CLASSES }) {
  return (
    <div className={cn("bg-card", SIZE_CLASSES[size], className)} {...props} />
  );
}
