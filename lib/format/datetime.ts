export const DISPLAY_TIME_ZONE = "Asia/Phnom_Penh";

// "7:00 PM" — the "as of" / axis clock used on the price surfaces.
export function formatClockTime(at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(at);
}
