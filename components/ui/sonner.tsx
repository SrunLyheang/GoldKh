"use client";

import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/lib/theme/theme-context";

// Themed to the active token set (DESIGN.md). `richColors` is left off:
// green and red carry financial meaning here. The toast is a slip of
// paper styled in globals.css under `[data-sonner-toaster]`; `theme`
// follows Night / Day.
const LIGHT_THEMES = new Set(["day"]);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const isLight = LIGHT_THEMES.has(theme);

  return (
    <Sonner
      theme={isLight ? "light" : "dark"}
      position="top-center"
      // Clears the sticky mobile header (~56px, md:hidden) so the toast
      // isn't tucked behind it; desktop has no top chrome here.
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
