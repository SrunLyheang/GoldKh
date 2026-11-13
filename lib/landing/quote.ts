import Decimal from "decimal.js";
import { GRAMS_PER_TROY_OZ } from "@/lib/constants/units";
import { priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { DISPLAY_TIME_ZONE, formatClockTime } from "@/lib/format/datetime";
import { formatUsd } from "@/lib/format/money";

// Everything the landing page shows about the price, derived from real
// snapshots and pre-formatted on the server so the client tree only
// renders strings. Pure — the loader (./loadQuote.ts) does the I/O.

export interface PricePoint {
  pricePerTroyOz: string;
  capturedAt: Date;
}

// The pieces drawn on the velvet tray. Tapping one shows what that much
// gold is worth at today's price, so each carries a real weight.
export const TRAY_PIECES = {
  leaf1d: { quantity: "1", unit: "damlung" },
  leaf5c: { quantity: "5", unit: "chi" },
  leaf1c: { quantity: "1", unit: "chi" },
  ring: { quantity: "2", unit: "chi" },
  chain: { quantity: "1", unit: "damlung" },
} as const satisfies Record<string, { quantity: string; unit: GoldUnit }>;

export type TrayPieceId = keyof typeof TRAY_PIECES;

// The worked example below the fold: 2 damlung 3 chi, bought at a real
// past spot price, valued at today's. 1 damlung = 10 chi.
export const EXAMPLE_DAMLUNG = "2.3";

// A "since yesterday" comparison is only honest if the older snapshot is
// actually about a day old. Snapshots are written lazily on traffic, so
// the nearest one at-or-before 24h ago may be much older than that.
export const YESTERDAY_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type Direction = "up" | "down" | "flat";

export interface Localized {
  en: string;
  km: string;
}

export interface LandingQuote {
  perDamlung: string;
  perChi: string;
  perGram: string;
  asOf: Localized;
  // Weekday plus time — for the weekend "market closed" line, where a bare
  // clock time would be ambiguous.
  asOfDay: Localized;
  isStale: boolean;
  // Weekend: spot gold isn't trading, so the Friday close is the price.
  marketOpen: boolean;
  change: { direction: Direction; amount: string } | null;
  pieces: Record<TrayPieceId, string>;
  example: {
    date: Localized;
    paidPerDamlung: string;
    worthToday: string;
    difference: string;
    direction: Direction;
  } | null;
}

function direction(delta: Decimal): Direction {
  // Compare at the cent the figures are shown at, so a sub-cent wobble
  // never reads as "up".
  const cents = delta.toDecimalPlaces(2);
  if (cents.isZero()) return "flat";
  return cents.isPositive() ? "up" : "down";
}

function formatDate(at: Date): Localized {
  const opts = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  } as const;
  return {
    en: new Intl.DateTimeFormat("en-GB", opts).format(at),
    km: new Intl.DateTimeFormat("km-KH", { ...opts, month: "long" }).format(at),
  };
}

function formatDayTime(at: Date): Localized {
  const time = formatTime(at);
  const day = (locale: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: DISPLAY_TIME_ZONE }).format(at);
  return { en: `${day("en-US")} ${time.en}`, km: `${day("km-KH")} ${time.km}` };
}

function formatTime(at: Date): Localized {
  return {
    en: formatClockTime(at),
    km: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: DISPLAY_TIME_ZONE,
    }).format(at),
  };
}

export function buildLandingQuote(input: {
  latest: PricePoint;
  isStale: boolean;
  marketOpen: boolean;
  yesterday: PricePoint | null;
  past: PricePoint | null;
  now: Date;
}): LandingQuote {
  const { latest, yesterday, past, now } = input;
  const perDamlung = new Decimal(priceFromTroyOz(latest.pricePerTroyOz, "damlung"));

  let change: LandingQuote["change"] = null;
  if (
    yesterday &&
    now.getTime() - yesterday.capturedAt.getTime() <= YESTERDAY_MAX_AGE_MS
  ) {
    const before = new Decimal(priceFromTroyOz(yesterday.pricePerTroyOz, "damlung"));
    const delta = perDamlung.minus(before);
    change = {
      direction: direction(delta),
      amount: formatUsd(delta.abs().toString()),
    };
  }

  const pieces = Object.fromEntries(
    (Object.keys(TRAY_PIECES) as TrayPieceId[]).map((id) => {
      const { quantity, unit } = TRAY_PIECES[id];
      const value = new Decimal(priceFromTroyOz(latest.pricePerTroyOz, unit)).times(quantity);
      return [id, formatUsd(value.toString())];
    })
  ) as Record<TrayPieceId, string>;

  let example: LandingQuote["example"] = null;
  if (past) {
    const paid = new Decimal(priceFromTroyOz(past.pricePerTroyOz, "damlung"));
    const worth = perDamlung.times(EXAMPLE_DAMLUNG);
    const difference = worth.minus(paid.times(EXAMPLE_DAMLUNG));
    example = {
      date: formatDate(past.capturedAt),
      paidPerDamlung: formatUsd(paid.toString()),
      worthToday: formatUsd(worth.toString()),
      difference: formatUsd(difference.abs().toString()),
      direction: direction(difference),
    };
  }

  return {
    perDamlung: formatUsd(perDamlung.toString()),
    perChi: formatUsd(priceFromTroyOz(latest.pricePerTroyOz, "chi")),
    perGram: formatUsd(
      new Decimal(latest.pricePerTroyOz).div(GRAMS_PER_TROY_OZ).toString()
    ),
    asOf: formatTime(latest.capturedAt),
    asOfDay: formatDayTime(latest.capturedAt),
    isStale: input.isStale,
    marketOpen: input.marketOpen,
    change,
    pieces,
    example,
  };
}
