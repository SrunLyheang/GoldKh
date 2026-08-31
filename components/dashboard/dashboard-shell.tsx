"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { PrefsProvider } from "@/lib/prefs/prefs-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

// Wraps the dashboard route so mobile can have a hamburger-triggered
// drawer (Sidebar) plus a slim top bar, while desktop keeps the
// original fixed-sidebar layout untouched (`md:ml-59` reserves the
// space Sidebar occupies since it's `fixed`, out of flow). LocaleProvider
// sits at this root so every dashboard descendant (including Sidebar's
// own toggle) shares one locale.
export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <LocaleProvider>
      <ThemeProvider>
        <PrefsProvider>
        <div className="vault-grain relative flex min-h-screen bg-background">
          <Sidebar open={open} onClose={() => setOpen(false)} />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col md:ml-59">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 md:hidden">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="flex items-center gap-2 font-mono text-[15px] font-semibold tracking-tight text-primary">
                <Image
                  src="/icon.svg"
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-sm"
                />
                GoldKh
              </span>
              <div className="flex shrink-0 items-center gap-2.5">
                <ThemeToggle />
                <UserButton
                  appearance={{ elements: { userButtonBox: "flex-row-reverse" } }}
                />
              </div>
            </header>
            <main className="flex-1 px-4 py-7 md:px-10 md:py-9">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
        </PrefsProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
