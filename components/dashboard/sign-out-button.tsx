"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/ui/loading";
import { useLocale } from "@/lib/i18n/locale-context";
import { notify } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

// The app's only sign-out path. Clerk's built-in <UserButton> "Sign out"
// is hidden (see sidebar.tsx / dashboard-shell.tsx appearance) because it
// does a soft client-side navigation to afterSignOutUrl — with the App
// Router RSC Router Cache still holding the signed-in view of "/", that
// left the page apparently frozen until a manual refresh.
//
// This does what components/settings/data-actions.tsx already does after
// account deletion: sign out, then hard-navigate so a full server render
// of "/" runs with no session cookie and every piece of client state is
// dropped. A full-screen overlay covers the gap so the wait reads as
// intentional rather than a hang.
export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  const { t } = useLocale();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      await signOut();
    } catch {
      // Session still live — let the user retry rather than stranding them.
      setPending(false);
      notify.error(t.nav.signOutError);
      return;
    }
    // Hard navigation on purpose (see note above). Overlay stays up until
    // the new document paints.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        aria-label={t.nav.signOut}
        title={t.nav.signOut}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-(--glass-border-to) bg-accent/60 p-1.5 text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground disabled:opacity-60",
          className
        )}
      >
        {pending ? <Spinner size="sm" /> : <LogOut className="h-5 w-5" />}
      </button>

      {pending &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm"
            role="status"
            aria-live="assertive"
          >
            <Spinner size="lg" />
            <p className="tt-label text-[11px] text-muted-foreground">
              {t.nav.signingOut}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
