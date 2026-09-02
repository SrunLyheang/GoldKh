"use client";

import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/lib/theme/theme-context";

// Themed to the active token set (DESIGN.md). `richColors` is

const LIGHT_THEMES = new Set(["ledger", "porcelain", "coral"]);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const isLight = LIGHT_THEMES.has(theme);

  return (
    <Sonner
      theme={isLight ? "light" : "dark"}
      position="top-center"
      mobileOffset={{ top: "72px" }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-state-gain" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
      }}
      toastOptions={{ classNames: { toast: "font-sans" } }}
      {...props}
    />
  );
};

export { Toaster };
