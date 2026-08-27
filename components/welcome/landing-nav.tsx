"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/dashboard/language-toggle";
import { useLocale } from "@/lib/i18n/locale-context";
import { useSignedIn } from "./use-signed-in";

const CTA_CLASS =
  "tt-label border border-primary bg-primary px-4 py-2 text-[11px] text-primary-foreground shadow-vault-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LandingNav() {
  const { t } = useLocale();
  const signedIn = useSignedIn();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/welcome" className="flex items-center gap-2.5">
          <Image
            src="/icon.svg"
            alt=""
            aria-hidden
            width={22}
            height={22}
            className="h-[22px] w-[22px]"
          />
          <span className="tt-heading text-[15px] text-primary">GoldKh</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#features"
            className="tt-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.welcome.nav.features}
          </a>
          <a
            href="#how"
            className="tt-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.welcome.nav.how}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {signedIn ? (
            <Link href="/dashboard" className={CTA_CLASS}>
              {t.welcome.nav.goToDashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="tt-label hidden text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
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
