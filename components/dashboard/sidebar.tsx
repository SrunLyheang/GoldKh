"use client";

import { useUser } from "@clerk/nextjs";
import { Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  InsightsIcon,
  PriceIcon,
  TransactionsIcon,
} from "@/components/icons";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { AccountButton } from "./account-button";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

// Nav destinations rendered with the bespoke dashboard icon set
// (components/icons/). Settings is not here — it stays a separate
// footer <Link> on the user/profile row.
const NAV_ITEMS = [
  { labelKey: "dashboard" as const, href: "/dashboard", icon: DashboardIcon },
  {
    labelKey: "transactions" as const,
    href: "/dashboard/transactions",
    icon: TransactionsIcon,
  },
  { labelKey: "price" as const, href: "/dashboard/price", icon: PriceIcon },
  {
    labelKey: "insights" as const,
    href: "/dashboard/insights",
    icon: InsightsIcon,
  },
];

// Below `md`, this renders as a slide-in overlay drawer controlled by
// `open`/`onClose` (see dashboard-shell.tsx for the hamburger trigger).
// At `md` and above it's always visible and `open`/`onClose` have no
// effect, matching the original fixed-sidebar behavior exactly.
export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const settingsActive = pathname === "/dashboard/settings";
  const identifier =
    user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-(--glass-scrim) backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "glass-chrome fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-(--glass-border-to) transition-transform duration-200 ease-out md:w-59 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-7 md:justify-start md:gap-2.5">
          <Image
            src="/icon.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="h-6 w-6 rounded-sm"
          />
          <span className="font-mono text-[15px] font-semibold tracking-tight text-primary">
            GoldKh
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-muted-foreground hover:bg-(--glow-color) hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav
          aria-label="Primary"
          className="flex flex-1 flex-col gap-1.5 px-3.5 pt-1"
        >
          {NAV_ITEMS.map(({ labelKey, href, icon: Icon }) => {
            // Exact match, not startsWith: child routes like
            // /dashboard/transactions must not also light up Dashboard.
            const active = pathname === href;
            const label = t.nav[labelKey];
            return (
              <Link
                key={labelKey}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                  active
                    ? "bg-(--glow-color) text-foreground"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-(--glow-color) hover:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1.5 left-0 w-0.5 bg-primary"
                  />
                )}
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span className="tt-label text-[12px]">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-(--glass-border-to) px-4 py-5">
          <ThemeToggle className="self-start" />
          {identifier && (
            <p
              className="truncate text-[12px] text-muted-foreground"
              title={identifier}
            >
              {identifier}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <AccountButton />
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                aria-label={t.nav.settings}
                aria-current={settingsActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-(--glass-border-to) bg-accent/60 transition-colors hover:bg-(--glow-color) hover:text-foreground",
                  settingsActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
