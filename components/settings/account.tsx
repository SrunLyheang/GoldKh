"use client";

import { UserProfile, useClerk, useUser } from "@clerk/nextjs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dictionary";
import { Panel } from "@/components/dashboard/panel";

// Clerk's own account UI, embedded (hash routing so it stays on this
// page). Kept in its own client island — same bare approach as the
// sign-in / sign-up pages, which don't remap Clerk's internals either.
// A plain session row sits on top: Clerk buries sign-out inside the
// UserButton dropdown, so Settings gets its own explicit control.
export function AccountSettings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, startSignOut] = useTransition();

  const identity =
    user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? user?.username;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
        {t.settings.accountTitle}
      </h2>
      <Panel size="lg" className="flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--glass-border-to) py-4 first:pt-0">
          <div className="max-w-[42ch]">
            <p className="text-[13px] font-medium text-foreground">
              {t.settings.signOut}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {identity ? (
                <>
                  {t.settings.signedInAs}{" "}
                  <span className="text-foreground">{identity}</span>.{" "}
                </>
              ) : null}
              {t.settings.signOutDescription}
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={signingOut}
            onClick={() =>
              startSignOut(async () => {
                await signOut({ redirectUrl: "/" });
              })
            }
          >
            {t.settings.signOut}
          </Button>
        </div>
        <div className="overflow-x-auto pt-4">
          <UserProfile
            routing="hash"
            appearance={{
              // Colours only — pull Clerk's embedded UI onto the glass
              // palette so it doesn't read as a pasted-in white card.
              // Every value is a token; no layout or structural overrides.
              variables: {
                colorBackground: "transparent",
                colorForeground: "var(--foreground)",
                colorMutedForeground: "var(--muted-foreground)",
                colorMuted: "var(--glass-bg)",
                colorPrimary: "var(--primary)",
                colorPrimaryForeground: "var(--primary-foreground)",
                colorInput: "var(--glass-bg)",
                colorInputForeground: "var(--foreground)",
                colorBorder: "var(--glass-border-to)",
                colorNeutral: "var(--foreground)",
                colorDanger: "var(--destructive)",
                borderRadius: "var(--radius)",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full border-none shadow-none bg-transparent",
                navbar: "bg-transparent border-(--glass-border-to)",
                pageScrollBox: "bg-transparent",
                dividerLine: "bg-(--glass-border-to)",
              },
            }}
          />
        </div>
      </Panel>
    </section>
  );
}
