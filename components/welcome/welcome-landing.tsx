"use client";

import Link from "next/link";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { FeatureGrid } from "./feature-grid";
import { HowItWorks } from "./how-it-works";
import { LandingFooter } from "./landing-footer";
import { SectionEyebrow } from "./section-eyebrow";

// The whole landing page is a client tree so the English/Khmer toggle
// (LocaleProvider + useLocale, both client-only — see lib/i18n) works
// here exactly as it does on the dashboard. The route file
// (app/welcome/page.tsx) stays a server component and owns <metadata>.
export function WelcomeLanding() {
  return (
    <LocaleProvider>
      <div className="vault-grain relative min-h-screen overflow-x-hidden bg-background text-foreground">
        <LandingNav />
        <main className="relative z-10">
          <LandingHero />
          <TrustStrip />
          <FeatureGrid />
          <HowItWorks />
          <CtaBand />
        </main>
        <LandingFooter />
      </div>
    </LocaleProvider>
  );
}

// A single telemetry-style rule of hard facts, framed like the readout
// labels in the hero. Full-bleed band, hairline top/bottom borders.
function TrustStrip() {
  const { t } = useLocale();
  const items = [
    t.welcome.trust.notExchange,
    t.welcome.trust.noMoney,
    t.welcome.trust.dataYours,
    t.welcome.trust.units,
  ];

  return (
    <div className="border-y border-border bg-card">
      <ul className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-6">
            {i > 0 && (
              <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
            )}
            <span className="tt-label text-[10.5px] text-muted-foreground">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inverted gold plate — the one loud surface on the page. Everything
// else is dark-on-dark with a hairline gold accent; this block is the
// exception, so the final call to action reads as the destination.
function CtaBand() {
  const { t } = useLocale();

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28">
      <div className="vault-enter border border-primary bg-primary px-6 py-12 text-primary-foreground shadow-vault-lg sm:px-14 sm:py-16">
        <SectionEyebrow className="text-primary-foreground/70">
          {t.welcome.cta.button}
        </SectionEyebrow>
        <h2 className="tt-heading mt-4 max-w-[18ch] text-2xl leading-[1.1] sm:text-4xl">
          {t.welcome.cta.title}
        </h2>
        <p className="mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-primary-foreground/80">
          {t.welcome.cta.body}
        </p>
        <Link
          href="/sign-up"
          className="tt-label mt-8 inline-flex items-center gap-2 border border-primary-foreground bg-primary-foreground px-5 py-3 text-[11px] text-primary transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
        >
          {t.welcome.cta.button}
          <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
