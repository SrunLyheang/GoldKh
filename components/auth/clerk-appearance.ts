/**
 * Shared Clerk `appearance` for the sign-in / sign-up pages.
 *
 * The form sits in a dark panel that inherits `<ClerkProvider>`'s
 * `shadcn` base theme (the app is dark-only), so no colours are
 * overridden here. Two jobs only:
 *  1. strip Clerk's own card chrome + header so the form sits flat
 *     under the <AuthShell> heading;
 *  2. force the OUTER card containers to be fluid — Clerk ships the
 *     card with a fixed `width: 400px`, which overflows and gets
 *     clipped in a narrow panel (or at browser zoom). Only rootBox /
 *     cardBox / card get width overrides; the inner layout
 *     (`cl-main`, `cl-form`, …) is left untouched so it stays centred.
 *
 * Not annotated with Clerk's `Appearance` type on purpose: passing a
 * plain const through the `appearance` prop skips TS excess-property
 * checks, which keeps this resilient across Clerk minor versions.
 */
export const authAppearance = {
  elements: {
    rootBox: "!w-full max-w-full",
    cardBox: "!w-full max-w-full border-0 bg-transparent shadow-none",
    card: "!w-full max-w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    footer: "bg-transparent",
  },
};
