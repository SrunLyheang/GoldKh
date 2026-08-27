import type { Metadata } from "next";
import { WelcomeLanding } from "@/components/welcome/welcome-landing";

// Public marketing page. "/" now renders this same landing for
// signed-out visitors (see app/page.tsx); this route is the stable
// canonical URL for it and always renders regardless of auth state.
export const metadata: Metadata = {
  title: "GoldKh — Track your gold against the live spot price",
  description:
    "Record gold buys and sells in chi and damlung, and see your weighted-average cost, market value, and unrealized gain or loss against the live spot price. Not an exchange.",
};

export default function WelcomePage() {
  return <WelcomeLanding />;
}
