import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  lg: "rounded-xl p-4 sm:p-6",
  md: "rounded-lg p-4",
} as const;

export function Panel({
  className,
  size = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: keyof typeof SIZE_CLASSES }) {
  return (
    <div
      className={cn("border border-border bg-card", SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}
