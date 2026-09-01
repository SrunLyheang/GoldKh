"use client";

import { UserButton } from "@clerk/nextjs";

// Clerk's <UserButton> configured for the dashboard chrome, so no call
// site has to repeat the `appearance` overrides or know Clerk's internal
// element keys:
//
//  - `userButtonBox: flex-row-reverse` puts the avatar after the name.
//  - the popover's built-in "Sign out" row is hidden, because it does a
//    soft client-side nav to afterSignOutUrl and — with the App Router
//    RSC cache still holding the signed-in view of "/" — leaves the page
//    apparently frozen until a manual refresh. Render <SignOutButton>
//    (which hard-navigates) somewhere alongside this instead.
//
// `showName` is forwarded (the sidebar shows it, the mobile top bar
// doesn't).
export function AccountButton({ showName }: { showName?: boolean }) {
  return (
    <UserButton
      showName={showName}
      appearance={{
        elements: {
          userButtonBox: "flex-row-reverse",
          userButtonPopoverActionButton__signOut: { display: "none" },
        },
      }}
    />
  );
}
