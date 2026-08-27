import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Khmer } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

export const metadata: Metadata = {
  title: "GoldKh",
  description: "Track personal gold holdings against the live spot price.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable, notoSansKhmer.variable)}
    >
      <body className="font-sans">
        <ClerkProvider
          appearance={{ theme: shadcn }}
          localization={{ signIn: { start: { title: "Sign in" } } }}
        >
          {children}
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}