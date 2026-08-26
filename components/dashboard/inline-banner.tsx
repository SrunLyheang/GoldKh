import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InlineBanner({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-2 rounded-md border px-3 py-2 text-[12.5px]",
        variant === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
        variant === "success" && "border-primary/40 bg-primary/10 text-primary"
      )}
    >
      {children}
    </div>
  );
}
