"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

// Quiet closing rule: wordmark + tagline on the left, the honest
// disclaimer and a source link on the right. Hairline top border, no
// shadow — it should read as the page ending, not another panel.
export function LandingFooter() {
  const { t } = useLocale();
  const f = t.welcome.footer;

  return (
    <footer className="relative z-10 border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-[40ch]">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <Image
              src="/icon.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <span className="tt-heading text-[14px] text-primary">GoldKh</span>
          </Link>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {f.tagline}
          </p>
          <p className="tt-label mt-3 text-[10px] text-muted-foreground">
            {f.notExchange}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <a
            href="https://github.com/SrunLyheang/GoldKh"
            target="_blank"
            rel="noreferrer"
            className="tt-label text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {f.source}
          </a>
          <span className="tt-label text-[10.5px] text-muted-foreground">
            {f.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
