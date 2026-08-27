import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Newsreader, Noto_Sans_Khmer } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// Geist has no Khmer glyphs — the km locale falls back to this instead
// of the browser's unstyled system Khmer font. Exposed as a CSS
// variable and switched in via globals.css's `html[lang="km"]` rule
// rather than always-on, so English stays on Geist Sans exactly as
// before.
const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  weight: ["400", "500", "600"],
  variable: "--font-khmer",
});

// Editorial serif for the Ledger theme's headings and hero price.
// Referenced only from globals.css's `[data-theme="ledger"]` block —
// the default Vault theme never renders it.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
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
        GeistSans.variable,
        GeistMono.variable,
        notoSansKhmer.variable,
        newsreader.variable
      )}
    >
      <body className="font-sans">
        <ClerkProvider
          appearance={{ theme: shadcn }}
          localization={{ signIn: { start: { title: "Sign in" } } }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}