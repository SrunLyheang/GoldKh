"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { SampleReadout } from "./sample-readout";
import { SectionEyebrow } from "./section-eyebrow";
import { useSignedIn } from "./use-signed-in";

const PRIMARY_CTA_CLASS =
  "tt-label inline-flex items-center gap-2 border border-primary bg-primary px-5 py-3 text-[11px] text-primary-foreground shadow-vault-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Two-column hero: the pitch on the left, a static replica of the real
// dashboard hero card on the right (SampleReadout). The card is the only
// product surface shown on the page — no stock illustration — so the
// second column carries a small enter-delay to land just after the copy.
export function LandingHero() {
  const { t } = useLocale();
  const signedIn = useSignedIn();

  return (
    <section className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
      <div className="vault-enter">
        <SectionEyebrow>{t.welcome.hero.eyebrow}</SectionEyebrow>
        <h1 className="tt-heading mt-5 max-w-[16ch] text-3xl leading-[1.05] sm:text-5xl">
          {t.welcome.hero.headline}
        </h1>
        <p className="mt-5 max-w-[52ch] text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          {t.welcome.hero.subhead}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {signedIn ? (
            <Link href="/dashboard" className={PRIMARY_CTA_CLASS}>
              {t.welcome.nav.goToDashboard}
              <span aria-hidden>&rarr;</span>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className={PRIMARY_CTA_CLASS}>
                {t.welcome.nav.getStarted}
                <span aria-hidden>&rarr;</span>
              </Link>
              <Link
                href="/sign-in"
                className="tt-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.welcome.nav.signIn}
              </Link>
            </>
          )}
        </div>

        <p className="tt-label mt-6 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span aria-hidden className="h-1.5 w-1.5 bg-primary" />
          {t.welcome.hero.trustLine}
        </p>
      </div>

      <div
        className="vault-enter flex justify-center lg:justify-end"
        style={{ "--enter-delay": "120ms" } as CSSProperties}
      >
        <SampleReadout />
      </div>
    </section>
  );
}
