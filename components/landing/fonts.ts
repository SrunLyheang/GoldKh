import { Kantumruy_Pro, Koulen, Moul } from "next/font/google";

// The landing page's own faces — loaded only by this tree, never by the
// app (DESIGN.md governs the app's Plex faces). All three cover Khmer.
//   Koulen  — condensed sign lettering, for the wordmark and headings.
//   Moul    — the ornate Khmer face of Cambodian shop signs; Khmer only,
//             used for the price board's Khmer title and the leaf stamps.
//   Kantumruy Pro — calm body face for both scripts.
export const koulen = Koulen({
  weight: "400",
  subsets: ["latin", "khmer"],
  variable: "--font-koulen",
  display: "swap",
});

export const moul = Moul({
  weight: "400",
  subsets: ["khmer"],
  variable: "--font-moul",
  display: "swap",
});

export const kantumruy = Kantumruy_Pro({
  subsets: ["latin", "khmer"],
  variable: "--font-kantumruy",
  display: "swap",
});
