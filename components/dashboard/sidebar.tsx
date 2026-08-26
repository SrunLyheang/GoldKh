"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";

// "History" was removed — it pointed at "/dashboard#history", an anchor
// on this same page rather than a real separate route. Add a real nav
// item back here if/when history becomes its own page.
const NAV_ITEMS = [{ labelKey: "dashboard" as const, href: "/dashboard", icon: LayoutDashboard }];

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
  const { t } = useLocale();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 ease-out md:w-59 md:translate-x-0",
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
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 px-3.5 pt-1">
          {NAV_ITEMS.map(({ labelKey, href, icon: Icon }) => {
            const active = pathname === href.split("#")[0];
            const label = t.nav[labelKey];
            return (
              <Link
                key={labelKey}
                href={href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent/60 hover:text-accent-foreground"
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
        <div className="flex flex-col gap-4 border-t border-border px-4 py-5">
          <LanguageToggle className="self-start" />
          <UserButton
            appearance={{ elements: { userButtonBox: "flex-row-reverse" } }}
            showName
          />
        </div>
      </aside>
    </>
  );
}
