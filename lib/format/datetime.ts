export const DISPLAY_TIME_ZONE = "Asia/Phnom_Penh";

// "7:00 PM" — the "as of" / axis clock used on the price surfaces.
export function formatClockTime(at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(at);
}

// A `YYYY-MM-DD` transaction date as a notebook would write it: "28 Oct",
// with the year added when it isn't this year ("21 Nov 2025"). Parsed as
// a calendar date (UTC), so no time zone can shift it by a day.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEntryDate(dateKey: string, now: Date = new Date()): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d || m > 12) return dateKey;
  const day = `${d} ${MONTHS[m - 1]}`;
  return y === now.getUTCFullYear() ? day : `${day} ${y}`;
}
