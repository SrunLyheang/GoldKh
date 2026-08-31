/**
 * Shared Clerk `appearance` for the sign-in / sign-up pages.
 *
 * The form sits in a dark panel that inherits `<ClerkProvider>`'s
 * `shadcn` base theme (the app is dark-only), so no colours are
 * overridden here — this only strips Clerk's own card chrome and header
 * so the form sits flat under the heading rendered by <AuthShell>.
 *
 * Not annotated with Clerk's `Appearance` type on purpose: passing a
 * plain const through the `appearance` prop skips TS excess-property
 * checks, which keeps this resilient across Clerk minor versions.
 */
export const authAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full border-0 bg-transparent shadow-none",
    card: "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    footer: "bg-transparent",
  },
};
