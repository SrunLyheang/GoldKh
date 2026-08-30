// The app tracks one market (Cambodian gold) for one audience, so every
// clock time shown in the UI is Phnom Penh time — not the viewer's local
// time and not the host's. Pinning the zone also keeps server-rendered
// markup byte-identical to the browser's first paint: an
// `Intl.DateTimeFormat` with no `timeZone` resolves to the host zone on
// the server (UTC in production) and the visitor's zone on the client,
// and the differing text aborts hydration (React error #418).
export const DISPLAY_TIME_ZONE = "Asia/Phnom_Penh";

// "7:00 PM" — the "as of" / axis clock used on the price surfaces.
export function formatClockTime(at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(at);
}
