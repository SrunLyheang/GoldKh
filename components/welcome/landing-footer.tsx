"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

// Quiet close: wordmark + tagline on the left, the honest disclaimer and
// a source link on the right. Hairline top border, no shadow — it reads
// as the page ending, not another panel.
export function LandingFooter() {
  const { t } = useLocale();
  const f = t.welcome.footer;

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[42ch]">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <Image
              src="/icon.svg"
              alt=""
              aria-hidden
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
            />
            <span className="font-[family-name:var(--font-newsreader)] text-[15px] text-foreground">
              GoldKh
            </span>
          </Link>
          <p className="mt-3 text-[12.5px] leading-[1.7] text-muted-foreground">
            {f.tagline}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {f.notExchange}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <a
            href="https://github.com/SrunLyheang/GoldKh"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {f.source}
          </a>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {f.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
