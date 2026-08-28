"use client";

import Link from "next/link";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
import { LandingThemeProvider, useLandingTheme } from "./landing-theme";
import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { FeatureGrid } from "./feature-grid";
import { HowItWorks } from "./how-it-works";
import { LandingFooter } from "./landing-footer";
import { SectionEyebrow } from "./section-eyebrow";
import { useReveal, useInView } from "./use-reveal";

const SERIF = "font-[family-name:var(--font-newsreader)]";

// The marketing page is a client tree so the English/Khmer toggle
// (LocaleProvider) and the light/dark toggle (LandingThemeProvider,
// self-contained from the dashboard's theme system) both work here.
// The route files (app/page.tsx, app/welcome/page.tsx) stay server
// components and own <metadata>.
export function WelcomeLanding() {
  return (
    <LocaleProvider>
      <LandingThemeProvider>
        <LandingShell />
      </LandingThemeProvider>
    </LocaleProvider>
  );
}

// Reads the landing theme and stamps it on the wrapper as
// `data-landing-theme`; globals.css scopes the "Assay" token sets to
// that attribute, so nothing below needs to know which theme is active.
function LandingShell() {
  const { theme } = useLandingTheme();

  return (
    <div
      data-landing-theme={theme}
      className="landing-root relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-200"
    >
      <LandingNav />
      <main className="relative">
        <LandingHero />
        <TrustRail />
        <FeatureGrid />
        <HowItWorks />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}

// One ruled line of plain facts, hairline top and bottom. Sits between
// the hero and the feature bento so the page reads background / rule /
// content down its length.
function TrustRail() {
  const { t } = useLocale();
  const { ref, visible } = useInView<HTMLUListElement>();
  const items = [
    t.welcome.trust.notExchange,
    t.welcome.trust.noMoney,
    t.welcome.trust.dataYours,
    t.welcome.trust.units,
  ];

  return (
    <div className="border-y border-border">
      <ul
        ref={ref}
        className={`landing-stagger ${
          visible ? "is-visible" : ""
        } mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-4`}
      >
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-8">
            {i > 0 && (
              <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
            )}
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Quiet close: a single serif line and one button, framed by hairline
// rules on the page ground. No inverted plate — the CTA is the last
// thing you read, it doesn't need to shout.
function CtaBand() {
  const { t } = useLocale();
  const { ref, revealClass, style } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={style}
      className={`${revealClass} mx-auto max-w-3xl px-5 py-24 text-center sm:py-28`}
    >
      <div className="border-y border-border py-14 sm:py-16">
        <SectionEyebrow>{t.welcome.cta.button}</SectionEyebrow>
        <h2
          className={`${SERIF} mt-4 text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[36px]`}
        >
          {t.welcome.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[14px] leading-[1.7] text-muted-foreground">
          {t.welcome.cta.body}
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.welcome.cta.button}
          <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
