// Whether the global spot-gold market (XAU/USD, the feed goldapi.io quotes)
// is trading right now. The dashboard consults this before spending a
// goldapi.io request on a weekend when the price cannot have moved, and to
// switch the UI into a "market closed" state — see CONTEXT.md "market hours".
//
// Spot gold trades from Sunday 22:00 UTC through Friday 21:00 UTC. We use
// fixed UTC boundaries and deliberately do NOT track US daylight-saving:
// the real open/close shifts an hour between EST and EDT, and chasing that
// hour on an otherwise-dead market isn't worth carrying a DST calendar.
// Worst case this reads one hour conservative in northern-hemisphere winter.
export function isMarketOpen(now: Date = new Date()): boolean {
  const day = now.getUTCDay(); // 0 = Sunday … 6 = Saturday
  const hour = now.getUTCHours();

  if (day === 6) return false; // all of Saturday
  if (day === 5 && hour >= 21) return false; // Friday from 21:00 UTC on
  if (day === 0 && hour < 22) return false; // Sunday until 22:00 UTC

  return true;
}
