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
// `showName` is forwarded but currently unused at every call site: the
// sidebar renders the identifier itself as a full-width truncating line
// (Clerk's inline `showName` label has no width cap and overflowed the
// ~236px sidebar into the settings gear), and the mobile top bar never
// showed it. Kept on the prop so a future call site can opt back in.
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
