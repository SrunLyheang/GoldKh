"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";

// Wraps the dashboard route so mobile can have a hamburger-triggered
// drawer (Sidebar) plus a slim top bar, while desktop keeps the
// original fixed-sidebar layout untouched (`md:ml-59` reserves the
// space Sidebar occupies since it's `fixed`, out of flow).
export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col md:ml-59">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-mono text-[15px] font-semibold text-primary">
            GoldKh
          </span>
          <UserButton
            appearance={{ elements: { userButtonBox: "flex-row-reverse" } }}
          />
        </header>
        <main className="flex-1 px-4 py-6 md:px-9 md:py-[30px]">
          {children}
        </main>
      </div>
    </div>
  );
}
