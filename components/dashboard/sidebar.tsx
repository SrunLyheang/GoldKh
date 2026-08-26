"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// "History" was removed — it pointed at "/dashboard#history", an anchor
// on this same page rather than a real separate route. Add a real nav
// item back here if/when history becomes its own page.
const NAV_ITEMS = [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }];

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
        <div className="flex items-center justify-between px-6 py-6 md:justify-start">
          <span className="font-mono text-[15px] font-semibold text-primary">
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
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href.split("#")[0];
            return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-4">
          <UserButton
            appearance={{ elements: { userButtonBox: "flex-row-reverse" } }}
            showName
          />
        </div>
      </aside>
    </>
  );
}
