"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import { ExampleNotebook } from "./example-notebook";
import { useSignedIn } from "./use-signed-in";

// The public page. It is the notebook itself: the first screen is an
// example page the visitor can write in (the one interactive hero), and
// the rest are the notebook's back pages — how the units work, what
// GoldKh does beside what you do, and what it is not. Everything stays
// calm around the hero. No invented facts: the only figures shown are
// the fixed unit conversions and an example page labelled as such.

const NAV = [
  { href: "#try", label: "Try a page" },
  { href: "#units", label: "Chi & damlung" },
  { href: "#how", label: "How it works" },
  { href: "#about", label: "What it isn't" },
];

function PrimaryCta({ signedIn, className }: { signedIn: boolean; className?: string }) {
  return signedIn ? (
    <Link
      href="/dashboard"
      className={cn(
        "press inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 text-body font-semibold text-primary-foreground hover:bg-primary/88",
        className,
      )}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      Open my notebook
    </Link>
  ) : (
    <Link
      href="/sign-up"
      className={cn(
        "press inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 text-body font-semibold text-primary-foreground hover:bg-primary/88",
        className,
      )}
    >
      Start your notebook
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function Header({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 pt-4 sm:px-6 md:px-10 md:pt-7">
      <Link href="/" aria-label="GoldKh, home" className="rounded-md">
        <Wordmark />
      </Link>
      <nav aria-label="On this page" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="press inline-flex min-h-11 items-center rounded-md px-3 text-detail text-muted-foreground hover:bg-(--glow-color) hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-1">
        {signedIn ? (
          <Link
            href="/dashboard"
            className="press inline-flex min-h-11 items-center rounded-md px-3.5 text-detail font-semibold text-gold hover:bg-(--glow-color)"
          >
            Go to my notebook
          </Link>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="press inline-flex min-h-11 items-center rounded-md px-3.5 text-detail font-medium text-muted-foreground hover:bg-(--glow-color) hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="press inline-flex min-h-11 items-center rounded-md bg-sunk px-3.5 text-detail font-semibold text-foreground hover:bg-(--glow-color)"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// Ten chi make one damlung: drawn as ten thin gold leaves beside the one
// bar they add up to. Simple geometry, one hand, labelled in text for
// screen readers.
function ChiDamlungDrawing() {
  const leaves = Array.from({ length: 10 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 360 120"
      role="img"
      aria-labelledby="units-drawing-title"
      className="h-auto w-full max-w-md"
    >
      <title id="units-drawing-title">Ten chi of gold leaf side by side equal one damlung bar.</title>
      {leaves.map((i) => (
        <g key={i} transform={`translate(${8 + i * 17} 22)`}>
          <rect width="12" height="62" rx="2" fill="var(--gold-leaf)" opacity={0.92 - (i % 3) * 0.07} />
          <rect x="2" y="4" width="3" height="54" rx="1.5" fill="var(--page)" opacity="0.25" />
        </g>
      ))}
      <text x="88" y="106" textAnchor="middle" className="fill-muted-foreground" style={{ font: "500 13px var(--font-sans)" }}>
        10 chi
      </text>
      <text x="196" y="60" textAnchor="middle" className="fill-foreground" style={{ font: "500 22px var(--font-heading)" }}>
        =
      </text>
      <g transform="translate(224 30)">
        <rect width="120" height="46" rx="5" fill="var(--gold-leaf)" />
        <rect x="6" y="6" width="108" height="34" rx="3" fill="none" stroke="var(--page)" strokeOpacity="0.35" strokeWidth="1.5" />
        <text x="60" y="29" textAnchor="middle" className="fill-cover-ink" style={{ font: "600 13px var(--font-sans)" }}>
          37.5 g
        </text>
      </g>
      <text x="284" y="106" textAnchor="middle" className="fill-muted-foreground" style={{ font: "500 13px var(--font-sans)" }}>
        1 damlung
      </text>
    </svg>
  );
}

const CONVERSIONS: { from: string; to: string }[] = [
  { from: "1 damlung", to: "10 chi" },
  { from: "1 damlung", to: "37.5 grams" },
  { from: "1 chi", to: "3.75 grams" },
  { from: "1 troy ounce", to: "31.1035 grams — about 8.29 chi" },
];

const YOU = [
  "Write down each buy: how much, in chi or damlung, and what you paid.",
  "Write down each sale the same way.",
  "Open today's page whenever you want to know where you stand.",
];
const IT = [
  "Keeps your average cost — a weighted average, so a sale never changes what the rest cost you.",
  "Values what you hold at the world spot price, and shows the time that price was taken.",
  "Always shows a price. If the price services are down, you see the last one and how old it is — never a blank page.",
];

export function NotebookLanding() {
  const signedIn = useSignedIn();

  return (
    <div className="app-grain app-lamp relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-page px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header signedIn={signedIn} />

      <main id="main" className="relative z-10">
        {/* First screen: the promise on the left, the example page on the
            right — the idea is on the first screen, not behind a button. */}
        <section className="mx-auto grid w-full max-w-[1240px] items-start gap-x-14 gap-y-10 px-4 pb-20 pt-10 sm:px-6 md:px-10 md:pt-16 lg:grid-cols-[1fr_1.05fr]">
          <div className="lg:sticky lg:top-16">
            <h1 className="font-serif text-hero font-semibold tracking-[-0.02em] text-foreground">
              See what your gold is worth, in the units you buy it in.
            </h1>
            <p className="mt-6 max-w-[34rem] text-emphasis leading-relaxed text-muted-foreground">
              GoldKh is a notebook for the gold you keep. Write down each buy
              from the shop in chi or damlung, and it works out what you hold,
              what it cost you and what it’s worth at today’s world price.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PrimaryCta signedIn={signedIn} />
              <a
                href="#try"
                className="press inline-flex min-h-12 items-center rounded-md px-4 text-body font-medium text-gold hover:bg-(--glow-color) lg:hidden"
              >
                Try a page first
              </a>
            </div>
            <p className="hand mt-10 hidden max-w-[28rem] -rotate-1 text-emphasis lg:block">
              Write a line on the page → and watch it add up. Then move the
              price.
            </p>
          </div>

          <ExampleNotebook className="shadow-(--shadow-float) lg:-rotate-[0.6deg]" />
        </section>

        {/* Back pages. Each one has a single job. */}
        <section
          id="units"
          aria-labelledby="units-title"
          className="scroll-mt-20"
        >
          <div className="mx-auto grid w-full max-w-[1240px] gap-x-14 gap-y-8 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-[22rem_1fr]">
            <div>
              <h2 id="units-title" className="font-serif text-figure-lg font-semibold leading-tight text-foreground">
                Chi and damlung, the way the shop says it.
              </h2>
              <p className="mt-4 max-w-[34ch] text-body text-muted-foreground">
                You write in the units you buy in. GoldKh does the converting
                to grams and ounces quietly, with no rounding along the way.
              </p>
            </div>
            <div className="flex flex-col gap-8">
              <ChiDamlungDrawing />
              <dl className="grid max-w-xl grid-cols-[auto_auto_1fr] items-baseline gap-x-4 gap-y-0">
                {CONVERSIONS.map((c) => (
                  <div key={c.to} className="contents">
                    <dt className="min-h-(--line) py-1 text-body font-medium tabular-nums text-foreground">
                      {c.from}
                    </dt>
                    <span aria-hidden="true" className="py-1 font-serif text-emphasis text-gold">
                      =
                    </span>
                    <dd className="py-1 text-body tabular-nums text-muted-foreground">{c.to}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section
          id="how"
          aria-labelledby="how-title"
          className="scroll-mt-20"
        >
          <div className="mx-auto w-full max-w-[1240px] px-4 py-20 sm:px-6 md:px-10">
            <h2 id="how-title" className="max-w-[24ch] font-serif text-figure-lg font-semibold leading-tight text-foreground">
              You write it down. It keeps the sums.
            </h2>
            {/* A ledger's two columns: what you do on the left, what the
                notebook does on the right, line for line. */}
            <div className="page page--plain mt-10 grid overflow-hidden rounded-xl md:grid-cols-2">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <h3 className="text-label font-semibold text-gold">You</h3>
                <ol className="mt-3 flex flex-col gap-4">
                  {YOU.map((line, i) => (
                    <li key={line} className="flex gap-3 text-body text-foreground">
                      <span className="font-serif text-emphasis tabular-nums text-faint">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-sunk/60 px-5 py-6 sm:px-8 sm:py-8">
                <h3 className="text-label font-semibold text-gold">GoldKh</h3>
                <ol className="mt-3 flex flex-col gap-4">
                  {IT.map((line, i) => (
                    <li key={line} className="flex gap-3 text-body text-foreground">
                      <span className="font-serif text-emphasis tabular-nums text-faint">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          aria-labelledby="about-title"
          className="scroll-mt-20"
        >
          <div className="mx-auto grid w-full max-w-[1240px] gap-x-14 gap-y-6 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-[22rem_1fr]">
            <h2 id="about-title" className="font-serif text-figure-lg font-semibold leading-tight text-foreground">
              What GoldKh is not.
            </h2>
            <div className="flex max-w-[60ch] flex-col gap-4 text-emphasis leading-relaxed text-muted-foreground">
              <p>
                <span className="text-foreground">Not a shop, an exchange or a wallet.</span>{" "}
                No money moves through GoldKh. It never holds your gold, never
                buys or sells for you, and never asks for card or bank details.
              </p>
              <p>
                <span className="text-foreground">Not your shop’s price.</span>{" "}
                It values your gold at the world spot price. Gold shops in
                Cambodia set their own buy and sell prices, so what a shop
                offers you may differ a little.
              </p>
              <p>
                <span className="text-foreground">Not shared.</span> Your
                entries are visible only to you, when you’re signed in.
              </p>
            </div>
          </div>
        </section>

        {/* The back cover. */}
        <section aria-labelledby="cover-title" className="px-4 pb-16 sm:px-6 md:px-10">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-6 rounded-xl bg-gold-leaf px-6 py-12 text-primary-foreground sm:px-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="cover-title" className="font-serif text-figure-lg font-semibold leading-tight text-cover-ink">
                Start a notebook for your family’s gold.
              </h2>
              <p className="mt-2 text-body text-cover-ink/80">Free to use. Your first entry takes a minute.</p>
            </div>
            {signedIn ? (
              <Link
                href="/dashboard"
                className="press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-cover-ink px-5 text-body font-semibold text-cover-paper hover:bg-cover-ink/90"
              >
                Open my notebook
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-cover-ink px-5 text-body font-semibold text-cover-paper hover:bg-cover-ink/90"
              >
                Start your notebook
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 pb-10 text-label text-faint sm:px-6 md:px-10">
        <p>© 2026 GoldKh · A record-keeper, not an exchange. No money moves through it.</p>
        <a
          href="https://github.com/SrunLyheang/GoldKh"
          className="press inline-flex min-h-11 items-center rounded-md px-2 hover:text-foreground"
        >
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
