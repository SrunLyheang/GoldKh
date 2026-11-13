import type { TrayPieceId } from "@/lib/landing/quote";

// Landing-page copy, English and Khmer. The landing tree is separate from
// the app's dictionary (lib/i18n/dictionary.ts, English-only for now).
//
// KHMER IS A DRAFT: written by the developer's assistant and not yet
// checked by a native reader. Review every `km` string before relying on
// it — see PRODUCT.md's note on why the app's own Khmer was pulled.

export type Lang = "en" | "km";

export interface LandingCopy {
  openApp: string;
  switchTo: string;
  boardTitle: string;
  perDamlung: string;
  perChi: string;
  perGram: string;
  liveAsOf: (time: string) => string;
  staleAsOf: (time: string) => string;
  closedAsOf: (dayAndTime: string) => string;
  unavailable: string;
  change: (direction: "up" | "down" | "flat", amount: string) => string;
  cta: string;
  ctaNote: string;
  tapHint: string;
  pieceWorth: (value: string) => string;
  pieces: Record<TrayPieceId, string>;
  explainTitle: string;
  explainBody: string;
  explainNote: string;
  exampleBought: string;
  exampleQuantity: string;
  examplePaid: (date: string) => string;
  perDamlungShort: (value: string) => string;
  exampleWorth: string;
  exampleUp: string;
  exampleDown: string;
  exampleEven: string;
  exampleCaption: string;
  trayLabel: string;
}

const en: LandingCopy = {
  openApp: "Open the app",
  switchTo: "Language",
  boardTitle: "Today's gold price",
  perDamlung: "1 damlung",
  perChi: "1 chi",
  perGram: "1 gram",
  liveAsOf: (t) => `Live spot price · as of ${t}`,
  staleAsOf: (t) => `Last known spot price · as of ${t}`,
  closedAsOf: (t) => `Market closed · last price ${t}`,
  unavailable: "The live price is unavailable right now. It will be back shortly.",
  change: (d, a) =>
    d === "flat" ? "No change since yesterday" : `${d === "up" ? "▲" : "▼"} ${a} since yesterday`,
  cta: "Track your gold in real time",
  ctaNote: "Free. No sign-up. Your ledger is tied to this device.",
  tapHint: "Pick up a piece of gold to see what it's worth today.",
  pieceWorth: (v) => `${v} today`,
  pieces: {
    leaf1d: "1 damlung leaf",
    leaf5c: "5 chi leaf",
    leaf1c: "1 chi leaf",
    ring: "2 chi ring",
    chain: "1 damlung chain",
  },
  explainTitle: "Bought at the shop. Valued every time you look.",
  explainBody:
    "Write down each buy and sell the way the shop quoted it, in chi or damlung. GoldKh keeps your average cost and shows, at today's price, what your gold is worth and whether you're up or down.",
  explainNote:
    "Not an exchange. GoldKh never holds your gold or your money, and your local shop's price won't match the spot price exactly.",
  exampleBought: "You bought",
  exampleQuantity: "2 damlung 3 chi",
  examplePaid: (d) => `On ${d}, at`,
  perDamlungShort: (v) => `${v} / damlung`,
  exampleWorth: "Worth today",
  exampleUp: "Up",
  exampleDown: "Down",
  exampleEven: "Even",
  exampleCaption: "A worked example at real spot prices, then and now.",
  trayLabel: "Gold on a velvet shop tray",
};

const km: LandingCopy = {
  openApp: "បើកកម្មវិធី",
  switchTo: "ភាសា",
  boardTitle: "តម្លៃមាសថ្ងៃនេះ",
  perDamlung: "១ ដំឡឹង",
  perChi: "១ ជី",
  perGram: "១ ក្រាម",
  liveAsOf: (t) => `តម្លៃមាសពិភពលោក · គិតត្រឹមម៉ោង ${t}`,
  staleAsOf: (t) => `តម្លៃចុងក្រោយដែលដឹង · គិតត្រឹមម៉ោង ${t}`,
  closedAsOf: (t) => `ទីផ្សារបិទ · តម្លៃចុងក្រោយម៉ោង ${t}`,
  unavailable: "មិនទាន់អាចបង្ហាញតម្លៃបច្ចុប្បន្នបានទេ។ សូមរង់ចាំបន្តិច។",
  change: (d, a) =>
    d === "flat" ? "ដូចម្សិលមិញ" : `${d === "up" ? "▲" : "▼"} ${a} ធៀបនឹងម្សិលមិញ`,
  cta: "តាមដានមាសរបស់អ្នក តាមតម្លៃពេលនេះ",
  ctaNote: "ឥតគិតថ្លៃ។ មិនចាំបាច់ចុះឈ្មោះ។ បញ្ជីរបស់អ្នកភ្ជាប់ជាមួយឧបករណ៍នេះ។",
  tapHint: "ចុចលើមាស ដើម្បីមើលតម្លៃរបស់វានៅថ្ងៃនេះ។",
  pieceWorth: (v) => `${v} ថ្ងៃនេះ`,
  pieces: {
    leaf1d: "មាសសន្លឹក ១ ដំឡឹង",
    leaf5c: "មាសសន្លឹក ៥ ជី",
    leaf1c: "មាសសន្លឹក ១ ជី",
    ring: "ចិញ្ចៀន ២ ជី",
    chain: "ខ្សែក ១ ដំឡឹង",
  },
  explainTitle: "ទិញនៅហាង។ ដឹងតម្លៃរាល់ពេលអ្នកមើល។",
  explainBody:
    "កត់ត្រារាល់ការទិញ និងលក់ ដូចដែលហាងបានប្រាប់ ជាជី ឬដំឡឹង។ GoldKh គណនាថ្លៃដើមមធ្យមរបស់អ្នក ហើយបង្ហាញថា តាមតម្លៃថ្ងៃនេះ មាសរបស់អ្នកមានតម្លៃប៉ុន្មាន និងថាអ្នកចំណេញ ឬខាត។",
  explainNote:
    "GoldKh មិនមែនជាកន្លែងទិញលក់ទេ។ វាមិនរក្សាទុកមាស ឬលុយរបស់អ្នកឡើយ ហើយតម្លៃនៅហាងក្នុងស្រុក អាចខុសពីតម្លៃទីផ្សារពិភពលោកបន្តិច។",
  exampleBought: "អ្នកបានទិញ",
  exampleQuantity: "២ ដំឡឹង ៣ ជី",
  examplePaid: (d) => `នៅថ្ងៃ ${d} ក្នុងតម្លៃ`,
  perDamlungShort: (v) => `${v} / ដំឡឹង`,
  exampleWorth: "តម្លៃថ្ងៃនេះ",
  exampleUp: "ចំណេញ",
  exampleDown: "ខាត",
  exampleEven: "ស្មើ",
  exampleCaption: "ឧទាហរណ៍ គិតតាមតម្លៃទីផ្សារពិតប្រាកដ ពេលនោះ និងពេលនេះ។",
  trayLabel: "មាសនៅលើថាសវល្លូតក្នុងហាង",
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { en, km };
