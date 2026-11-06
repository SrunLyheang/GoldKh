import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { BackToWelcome } from "./back-to-welcome";

// Sign in / sign up: the notebook opened to its inside cover. Left, the
// cover's flyleaf ("this notebook belongs to …", the line waiting for a
// name); right, the form on a plain page. On a phone only the form page
// shows, with the wordmark above it.
export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  return (
    <main className="app-grain app-lamp relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Link href="/" aria-label="GoldKh, home" className="relative z-10 mb-6 rounded-md md:hidden">
        <Wordmark />
      </Link>
      <div className="relative z-10 grid w-full min-w-0 max-w-[980px] overflow-hidden rounded-xl shadow-(--shadow-float) md:grid-cols-[0.9fr_1fr]">
        <div className="relative hidden min-h-[34rem] flex-col justify-between bg-gold-leaf px-10 py-12 text-cover-ink md:flex">
          <Wordmark size="lg" className="text-cover-ink [&>span]:text-cover-ink/70" />
          <div>
            <p className="font-serif text-figure text-cover-ink/80">This notebook belongs to</p>
            <div aria-hidden="true" className="mt-10 border-b-[1.5px] border-cover-ink/50" />
            <p className="mt-10 max-w-[30ch] text-detail text-cover-ink/75">
              A record of the gold you keep: what you bought, what it cost,
              and what it’s worth today.
            </p>
          </div>
        </div>

        <div className="page page--plain flex min-w-0 flex-col items-center rounded-none px-6 py-10 sm:px-10 sm:py-12">
          <h1 className="text-center font-serif text-figure-lg font-semibold leading-tight text-foreground">
            {heading}
          </h1>
          <p className="mb-8 mt-1.5 text-center text-body text-muted-foreground">{subheading}</p>
          <div className="w-full min-w-0 max-w-[400px]">{children}</div>
          <div className="mt-6 flex justify-center">
            <BackToWelcome />
          </div>
        </div>
      </div>
    </main>
  );
}
