"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { AssayStrip } from "./sample-readout";
import { SectionEyebrow } from "./section-eyebrow";
import { useReveal, useInView } from "./use-reveal";
import { useSignedIn } from "./use-signed-in";

const SERIF = "font-[family-name:var(--font-newsreader)]";

const PRIMARY_CTA =
  "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Centered editorial masthead: eyebrow, a large serif headline, one
// short gold rule (the page's only brand-coloured mark besides the
// wordmark), the pitch, then the calls to action. The product itself
// shows once, below, as the AssayStrip — a single ruled readout rather
// than a boxed app screenshot.
export function LandingHero() {
  const { t } = useLocale();
  const signedIn = useSignedIn();
  const { ref: headRef, visible: headVisible } = useInView<HTMLDivElement>();
  const {
    ref: stripRef,
    revealClass: stripReveal,
    style: stripStyle,
  } = useReveal<HTMLDivElement>(140);

  return (
    <section className="mx-auto max-w-5xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
      <div
        ref={headRef}
        className={`landing-stagger ${
          headVisible ? "is-visible" : ""
        } mx-auto max-w-2xl text-center`}
      >
        <SectionEyebrow>{t.welcome.hero.eyebrow}</SectionEyebrow>
        <h1
          className={`${SERIF} mt-6 text-[34px] font-normal leading-[1.08] tracking-[-0.02em] text-foreground sm:text-[58px]`}
        >
          {t.welcome.hero.headline}
        </h1>
        <div
          aria-hidden
          className="mx-auto mt-7 h-px w-14 bg-[var(--brand-gold)]"
        />
        <p className="mx-auto mt-7 max-w-[52ch] text-[15px] leading-[1.7] text-muted-foreground">
          {t.welcome.hero.subhead}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {signedIn ? (
            <Link href="/dashboard" className={PRIMARY_CTA}>
              {t.welcome.nav.goToDashboard}
              <span aria-hidden>&rarr;</span>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className={PRIMARY_CTA}>
                {t.welcome.nav.getStarted}
                <span aria-hidden>&rarr;</span>
              </Link>
              <Link
                href="/sign-in"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.welcome.nav.signIn}
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        ref={stripRef}
        style={stripStyle}
        className={`${stripReveal} mt-14 sm:mt-16`}
      >
        <AssayStrip />
      </div>
    </section>
  );
}
