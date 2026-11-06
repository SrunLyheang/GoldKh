"use client";

import {
  BookOpen,
  ChartSpline,
  Lightbulb,
  NotebookPen,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

// The notebook's index tabs. On a desk they stand up from the top edge
// of the page (the active one is the same paper as the page beneath it,
// so it reads as "this is the page you're on"). On a phone they become
// a bottom bar in thumb reach. One list, two postures.
const TABS: { key: keyof typeof t.nav; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/dashboard", icon: BookOpen },
  { key: "transactions", href: "/dashboard/transactions", icon: NotebookPen },
  { key: "price", href: "/dashboard/price", icon: ChartSpline },
  { key: "insights", href: "/dashboard/insights", icon: Lightbulb },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href;
}

export function NotebookTabs({ className }: { className?: string }) {
  const isActive = useActive();
  return (
    <nav aria-label="Notebook" className={cn("flex items-end gap-1", className)}>
      {TABS.map(({ key, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press relative flex min-h-11 items-center gap-2 rounded-t-lg px-4 pb-2.5 pt-2 text-detail font-medium",
              active
                ? "bg-page text-foreground"
                : "bg-sunk/70 text-muted-foreground hover:bg-sunk hover:text-foreground",
            )}
          >
            <Icon
              className={cn("h-4 w-4", active ? "text-gold" : "text-faint")}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}

export function NotebookTabBar() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Notebook"
      className="fixed inset-x-0 bottom-0 z-40 bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {TABS.map(({ key, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-label",
                  active ? "text-foreground" : "text-faint",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full",
                    active && "bg-page",
                  )}
                >
                  <Icon
                    className={cn("h-[18px] w-[18px]", active && "text-gold")}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                {t.nav[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
