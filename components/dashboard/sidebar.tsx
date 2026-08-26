"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard#history", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-card">
      <div className="px-6 py-6">
        <span className="font-mono text-[15px] font-semibold text-primary">
          GoldKh
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href.split("#")[0];
          return (
            <Link
              key={label}
              href={href}
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
  );
}
