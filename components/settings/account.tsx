"use client";

import { UserProfile } from "@clerk/nextjs";
import { useLocale } from "@/lib/i18n/locale-context";
import { Panel } from "@/components/dashboard/panel";

// Clerk's own account UI, embedded (hash routing so it stays on this
// page). Kept in its own client island — same bare approach as the
// sign-in / sign-up pages, which don't remap Clerk's internals either.
export function AccountSettings() {
  const { t } = useLocale();
  return (
    <section className="flex flex-col gap-3">
      <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
        {t.settings.accountTitle}
      </h2>
      <Panel size="lg" className="overflow-x-auto">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full border-none shadow-none",
            },
          }}
        />
      </Panel>
    </section>
  );
}
