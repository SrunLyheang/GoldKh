"use client";

import { UserProfile, useClerk, useUser } from "@clerk/nextjs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dictionary";
import { SettingsRow, SettingsSection } from "./section";

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
    <SettingsSection title={t.settings.accountTitle} description={t.settings.accountDescription}>
        <SettingsRow
          title={t.settings.signOut}
          description={
            <>
              {identity ? (
                <>
                  {t.settings.signedInAs}{" "}
                  <span className="text-foreground">{identity}</span>.{" "}
                </>
              ) : null}
              {t.settings.signOutDescription}
            </>
          }
        >
          <Button
            variant="outline"
            disabled={signingOut}
            onClick={() =>
              startSignOut(async () => {
                await signOut({ redirectUrl: "/" });
              })
            }
          >
            {t.settings.signOut}
          </Button>
        </SettingsRow>
        <div className="-mx-2 overflow-x-auto">
          <UserProfile
            routing="hash"
            appearance={{
              // Colours only — pull Clerk's embedded UI onto the notebook
              // palette so it doesn't read as a pasted-in white card.
              // Every value is a token; no layout or structural overrides.
              variables: {
                colorBackground: "transparent",
                colorForeground: "var(--foreground)",
                colorMutedForeground: "var(--muted-foreground)",
                colorMuted: "var(--sunk)",
                colorPrimary: "var(--primary)",
                colorPrimaryForeground: "var(--primary-foreground)",
                colorInput: "var(--sunk)",
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
    </SettingsSection>
  );
}
