import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { loadLandingQuote } from "@/lib/landing/loadQuote";

// "/" — the landing page: today's real spot price, set out like a gold
// shop's price board over its velvet tray. Rendered per request so the
// price is the same cached live price the dashboard shows (getPrice()
// only calls a provider when the cache is older than 30 minutes).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GoldKh — Track your gold in real time",
  description:
    "Today's gold price per damlung, chi and gram, and a free ledger for the gold you bought at the shop. See what it's worth and whether you're up or down. No sign-up. Not an exchange.",
};

export default async function Home() {
  const now = new Date();
  const quote = await loadLandingQuote(now);
  return <Landing quote={quote} year={now.getFullYear()} />;
}
