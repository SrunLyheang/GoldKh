"use client";

import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/lib/theme/theme-context";

// Themed to the active token set (context/ui-context.md). `richColors` is
// left off deliberately — green and red carry financial meaning in this
// app, so the only coloured toasts are our own success/error, tinted with
// `--state-gain` / `--destructive`. The toast surface is frosted glass
// (`--glass-*`), and `theme` tracks the real theme via `useTheme()` so
// the light themes (Ledger, Porcelain) render light chrome instead of
// the previously hardcoded `"dark"`.
const LIGHT_THEMES = new Set(["ledger", "porcelain"]);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const isLight = LIGHT_THEMES.has(theme);

  return (
    <Sonner
      theme={isLight ? "light" : "dark"}
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-state-gain" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
      }}
      style={
        {
          "--normal-bg": "var(--glass-fallback-bg)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--glass-border-to)",
          "--border-radius": "var(--glass-radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-(--glass-fallback-bg) !text-card-foreground !border-(--glass-border-to) font-sans text-[13px] backdrop-blur-md",
          description: "!text-muted-foreground",
          success: "!border-state-gain/40",
          error: "!border-destructive/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
