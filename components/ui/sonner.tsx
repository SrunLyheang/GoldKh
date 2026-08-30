"use client";

import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Themed to the Vault token set (context/ui-context.md). `richColors` is
// left off deliberately — green and red carry financial meaning in this
// app, so the only coloured toasts are our own success/error, tinted with
// `--state-gain` / `--destructive`. The dashboard is dark-first; the light
// themes (Ledger, Porcelain) still read correctly because the surface
// colours below are theme-aware CSS variables.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-state-gain" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-card !text-card-foreground !border-border font-sans text-[13px]",
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
