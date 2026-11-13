import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// UI / body face. IBM Plex Sans — a humanist grotesque with actual
// character (the flared terminals, the true-italic), unlike the Geist
// default it replaces.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

// Every price, quantity and cost-basis figure. IBM Plex Mono has real
// tabular figures and pairs with Plex Sans as one family, so the number
// columns read as deliberate typesetting rather than "monospace =
// technical".
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Editorial serif for the Ledger theme's headings and hero price.
// Referenced only from globals.css's `[data-theme="ledger"]` block.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: "normal",
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoldKh",
  description: "Track personal gold holdings against the live spot price.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        plexSans.variable,
        plexMono.variable,
        newsreader.variable
      )}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
