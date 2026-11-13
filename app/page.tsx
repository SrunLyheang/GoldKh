import type { Metadata } from "next";
import { WelcomeLanding } from "@/components/welcome/welcome-landing";

// "/" is the public entry point: the marketing landing page. There is no
// sign-up — every call to action goes straight to /dashboard, where
// proxy.ts gives the browser its anonymous device id on arrival.
export const metadata: Metadata = {
  title: "GoldKh — Track your gold against the live spot price",
  description:
    "Record gold buys and sells in chi and damlung, and see your weighted-average cost, market value, and unrealized gain or loss against the live spot price. Not an exchange.",
};

export default function Home() {
  return <WelcomeLanding />;
}
