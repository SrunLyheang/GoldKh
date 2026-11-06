import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata, Viewport } from "next";
import {
  Besley,
  Kantumruy_Pro,
  Red_Hat_Text,
  Shantell_Sans,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeScript } from "@/lib/theme/theme-context";
import "./globals.css";

// The reading face: a warm, open humanist sans that stays clear at small
// sizes, with real tabular figures — every price and quantity lines up —
// and a plain, unslashed zero. Body text, labels, tables and inputs.
// See DESIGN.md § Typography.
const reading = Red_Hat_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-reading",
});

// The ledger face: a Clarendon-style serif from the era of printed
// account books. Headings and the big figures (with tabular figures on).
const ledger = Besley({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ledger",
});

// The user's own handwriting: only their notes and short margin remarks,
// never a figure. The INFM axis is set in globals.css (.hand).
const handwriting = Shantell_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["INFM"],
  variable: "--font-handwriting",
});

// Khmer script fallback for every role (ជី, ដំឡឹង, ៛) so Khmer words
// render in a face designed for them rather than a system default.
const khmer = Kantumruy_Pro({
  subsets: ["khmer"],
  weight: ["400", "500", "600"],
  variable: "--font-khmer",
});

export const metadata: Metadata = {
  title: "GoldKh",
  description:
    "A notebook for the gold you keep: record buys and sells in chi and damlung and see what it's worth today.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1713" },
    { media: "(prefers-color-scheme: light)", color: "#e8deca" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="night"
      className={cn(
        reading.variable,
        ledger.variable,
        handwriting.variable,
        khmer.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{ theme: shadcn }}
          localization={{ signIn: { start: { title: "Sign in" } } }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
