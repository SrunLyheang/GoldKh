"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/dashboard/language-toggle";
import { useLocale } from "@/lib/i18n/locale-context";
import { LandingThemeToggle } from "./landing-theme-toggle";
import { useSignedIn } from "./use-signed-in";

const CTA_CLASS =
  "inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const LINK_CLASS =
  "text-[13px] text-muted-foreground transition-colors hover:text-foreground";

export function LandingNav() {
  const { t } = useLocale();
  const signedIn = useSignedIn();

  return (
    <header className="landing-nav-enter sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/welcome" className="flex items-center gap-2.5">
          <Image
            src="/icon.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <span className="font-[family-name:var(--font-newsreader)] text-[16px] tracking-[-0.01em] text-foreground">
            GoldKh
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className={LINK_CLASS}>
            {t.welcome.nav.features}
          </a>
          <a href="#how" className={LINK_CLASS}>
            {t.welcome.nav.how}
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <LandingThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className={CTA_CLASS}>
              {t.welcome.nav.goToDashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={`hidden sm:inline ${LINK_CLASS}`}
              >
                {t.welcome.nav.signIn}
              </Link>
              <Link href="/sign-up" className={CTA_CLASS}>
                {t.welcome.nav.getStarted}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
