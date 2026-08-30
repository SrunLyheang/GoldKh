export type Locale = "en";

// Flat-ish nested dictionary, one entry per user-facing string. Only
// English ships right now — the Khmer locale and its toggle were removed
// 2026-08-29 pending a translation review. `Dictionary` is derived from
// `en`; re-adding a second locale means restoring a `const km: typeof en`
// object plus a toggle.
const en = {
  language: { en: "English", km: "Khmer" },
  nav: { dashboard: "Dashboard" },
  hero: {
    pricePer: (unit: string) => `Price per ${unit}`,
    live: "Live",
    stale: "Stale",
    asOf: (time: string) => `as of ${time}`,
    marketClosed: "Market closed — prices resume Monday.",
    disclaimer:
      "Cambodian gold shops price differently from the global spot rate shown here, so your local buying/selling price may not match exactly.",
  },
  unit: { chi: "Chi", damlung: "Damlung" },
  refresh: {
    label: "Refresh",
    refreshedRecently: "Refreshed recently",
    refreshed: "Refreshed",
    pleaseWait: (minutes: number) => `Please wait ${minutes} minutes`,
    couldntReach: "Couldn't reach the server — try again shortly",
    couldntRefresh: "Couldn't refresh the price — try again shortly",
    marketClosed: "Market's closed — prices resume Monday",
  },
  stat: {
    totalHoldings: "Total Holdings",
    averageCost: "Average Cost",
    marketValue: "Market Value",
    gainLoss: "Unrealized Gain/Loss",
    atCurrentSpot: "at current spot",
    per: (unit: string) => `per ${unit}`,
  },
  transactions: {
    title: "Transaction History",
    addTransaction: "Add transaction",
    date: "Date",
    quantity: "Quantity",
    paid: "Paid",
    currentValue: "Current Value",
    pnl: "P&L",
    buy: "Buy",
    sell: "Sell",
    saving: "Saving…",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    actionsFor: (type: string, quantity: string, unit: string) =>
      `Actions for ${type} of ${quantity} ${unit}`,
    khrNote: "KHR entries aren't converted to USD yet",
    sellNote: "Sell rows show proceeds, not an ongoing position",
    priceOffSpot:
      "This price is far from the current spot rate — it may be a typo. Edit the transaction to fix it.",
  },
  dialog: {
    editTitle: "Edit transaction",
    addTitle: "Add transaction",
    editDescription: "Update the details of this transaction.",
    addDescription: "Record a buy or sell against your gold holdings.",
    quantity: "Quantity",
    totalPaid: "Total amount paid",
    perUnitEquiv: (unit: string) => `Price per ${unit}`,
    currentSpot: "Current spot",
    priceHardLow:
      "That's less than a tenth of the current spot price. Check the total amount and quantity before saving.",
    priceHardHigh:
      "That's more than ten times the current spot price. Check the total amount and quantity before saving.",
    priceSoftLow:
      "This is well below the current spot price — double-check the total amount if that's unexpected.",
    priceSoftHigh:
      "This is well above the current spot price — double-check the total amount if that's unexpected.",
    date: "Date",
    notes: "Notes (optional)",
    saveTransaction: "Save transaction",
    savingChanges: "Saving changes…",
    savingTransaction: "Saving transaction…",
    exceedsHoldings: (quantity: string, unit: string) =>
      `This exceeds your current holdings of ${quantity} ${unit}.`,
    couldntSave: "Couldn't reach the server — the transaction was not saved.",
    somethingWrong: "Something went wrong",
    toast: {
      buyAdded: (quantity: string, unit: string) =>
        `Added ${quantity} ${unit} to your holdings.`,
      sellRecorded: (quantity: string, unit: string) =>
        `Recorded sale of ${quantity} ${unit}.`,
      updated: "Transaction updated.",
      checkFields: "Check the highlighted fields.",
      invalidInput:
        "Something in this transaction isn't valid. Check your entries and try again.",
      rateLimited: "You're saving too fast — wait a moment and try again.",
      sessionExpired: "Your session expired. Sign in again to save.",
      serverError:
        "Couldn't save — something went wrong on our end. Try again.",
      network: "No connection. Check your internet and try again.",
    },
  },
  empty: {
    title: "No holdings yet",
    description:
      "Record your first buy to start tracking your gold against the live spot price.",
  },
  chart: {
    notEnoughHistory:
      "Not enough price history yet — check back after a few refreshes.",
    marketClosed: "Market closed",
    marketClosedNote:
      "Showing the last price from Friday's close. Trading resumes Monday.",
  },
  realized: {
    eyebrow: "Realized",
    fromSales: (count: number) =>
      `from ${count} ${count === 1 ? "sale" : "sales"}`,
    caption:
      "Money you've locked in by selling gold, measured against what you paid for it. Gold you still hold isn't counted here — that's your unrealized figure above.",
  },
  welcome: {
    nav: {
      features: "Features",
      how: "How it works",
      signIn: "Sign in",
      getStarted: "Get started",
      goToDashboard: "Go to dashboard",
    },
    hero: {
      eyebrow: "Personal gold tracker",
      headline: "See what your gold is actually worth",
      subhead:
        "Record your buys and sells in chi and damlung. GoldKh works out your weighted-average cost, current market value, and unrealized gain or loss against the live spot price.",
      sampleTag: "Sample",
    },
    trust: {
      notExchange: "Not an exchange",
      noMoney: "No money moves",
      dataYours: "Your data, yours only",
      units: "USD, chi & damlung",
    },
    features: {
      kicker: "Features",
      title: "Built for how you actually hold gold",
      avgCostTitle: "Weighted-average cost",
      avgCostBody:
        "Every buy updates your true cost basis. A sell reduces the position without changing what the rest cost you.",
      livePriceTitle: "A price that's always there",
      livePriceBody:
        "The spot price is cached and timestamped. If every provider is down you still see the last known price and how old it is — never a blank screen.",
      unitsTitle: "Chi and damlung, natively",
      unitsBody:
        "Enter quantities the way a Cambodian gold shop quotes them. The headline price is per damlung, with chi and troy ounce alongside.",
      bilingualTitle: "English and ខ្មែរ",
      bilingualBody:
        "Switch the whole interface between English and Khmer at any time. Your numbers stay in tabular figures either way.",
    },
    steps: {
      kicker: "How it works",
      title: "Tracked in three steps",
      oneTitle: "Sign in",
      oneBody: "Create an account. Your holdings are visible only to you.",
      twoTitle: "Record buys and sells",
      twoBody:
        "Quantity, unit, price paid, and date. Edit or delete anything later.",
      threeTitle: "Watch your position",
      threeBody:
        "Holdings, market value, and unrealized gain or loss update against the live spot price.",
    },
    cta: {
      title: "Start tracking your gold today",
      body: "Free to use — just a clear picture of what you hold.",
      button: "Get started",
    },
    footer: {
      tagline: "Personal gold holdings, tracked against the live spot price.",
      notExchange: "Not an exchange. No money moves through this system.",
      source: "Source",
      rights: "© 2026 GoldKh",
    },
  },
};

export const dictionary = { en } as const;
export type Dictionary = typeof en;
