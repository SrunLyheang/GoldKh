"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PrefsProvider } from "@/lib/prefs/prefs-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { Toaster } from "@/components/ui/sonner";
import { Wordmark } from "@/components/brand/wordmark";
import { AccountButton } from "./account-button";
import { NotebookTabBar, NotebookTabs } from "./notebook-tabs";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

// The signed-in frame: a desk under a lamp with the notebook on it.
// Desktop: wordmark and the index tabs on one line, the page directly
// below so the active tab joins it. Phone: a slim top line and the tabs
// as a bottom bar in thumb reach.
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PrefsProvider>
        <div className="app-grain app-lamp relative min-h-dvh bg-background">
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-page px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-44 pt-4 sm:px-6 md:px-10 md:pb-16 md:pt-7">
            <header className="flex items-end justify-between gap-4">
              <Link
                href="/dashboard"
                className="mb-2.5 rounded-md"
                aria-label="GoldKh, today's page"
              >
                <Wordmark />
              </Link>
              <NotebookTabs className="hidden md:flex" />
              <div className="mb-1.5 flex shrink-0 items-center gap-1">
                <ThemeToggle />
                <AccountButton />
                <SignOutButton />
              </div>
            </header>
            <main id="main" className="flex-1 pt-3 md:pt-0">
              {children}
            </main>
          </div>
          <NotebookTabBar />
        </div>
        <Toaster />
      </PrefsProvider>
    </ThemeProvider>
  );
}
