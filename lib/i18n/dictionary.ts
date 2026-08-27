export type Locale = "en" | "km";

// Flat-ish nested dictionary, one entry per user-facing string. Both
// locales must share the exact same shape — `Dictionary` is derived from
// `en`, so a missing `km` key is a type error, not a silent English
// fallback at runtime.
const en = {
  language: { en: "English", km: "Khmer" },
  nav: { dashboard: "Dashboard" },
  hero: {
    pricePer: (unit: string) => `Price per ${unit}`,
    live: "Live",
    stale: "Stale",
    asOf: (time: string) => `as of ${time}`,
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
  },
  dialog: {
    editTitle: "Edit transaction",
    addTitle: "Add transaction",
    editDescription: "Update the details of this transaction.",
    addDescription: "Record a buy or sell against your gold holdings.",
    quantity: "Quantity",
    pricePerUnit: "Price per unit",
    totalCost: "Total cost",
    currentSpot: "Current spot",
    date: "Date",
    notes: "Notes (optional)",
    saveTransaction: "Save transaction",
    savingChanges: "Saving changes…",
    savingTransaction: "Saving transaction…",
    exceedsHoldings: (quantity: string, unit: string) =>
      `This exceeds your current holdings of ${quantity} ${unit}.`,
    couldntSave: "Couldn't reach the server — the transaction was not saved.",
    somethingWrong: "Something went wrong",
  },
  empty: {
    title: "No holdings yet",
    description:
      "Record your first buy to start tracking your gold against the live spot price.",
  },
  chart: {
    notEnoughHistory:
      "Not enough price history yet — check back after a few refreshes.",
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
      trustLine: "No money moves through GoldKh — it's a tracker, not an exchange.",
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
      oneBody:
        "Create an account with Clerk. Your holdings are visible only to you.",
      twoTitle: "Record buys and sells",
      twoBody:
        "Quantity, unit, price paid, and date. Edit or delete anything later.",
      threeTitle: "Watch your position",
      threeBody:
        "Holdings, market value, and unrealized gain or loss update against the live spot price.",
    },
    cta: {
      title: "Start tracking your gold today",
      body:
        "Free to use. No money moves through the system — just a clear picture of what you hold.",
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

const km: typeof en = {
  language: { en: "អង់គ្លេស", km: "ខ្មែរ" },
  nav: { dashboard: "ផ្ទាំងគ្រប់គ្រង" },
  hero: {
    pricePer: (unit: string) => `តម្លៃក្នុងមួយ${unit}`,
    live: "កំពុងផ្សាយផ្ទាល់",
    stale: "ចាស់",
    asOf: (time: string) => `គិតត្រឹម ${time}`,
    disclaimer:
      "ហាងលក់មាសនៅកម្ពុជាកំណត់តម្លៃខុសពីអត្រាទីផ្សារពិភពលោកដែលបង្ហាញនៅទីនេះ ដូច្នេះតម្លៃការទិញ/លក់ក្នុងស្រុកអាចមិនដូចគ្នាទាំងស្រុងទេ។",
  },
  unit: { chi: "ជី", damlung: "ដំឡឹង" },
  refresh: {
    label: "ធ្វើបច្ចុប្បន្នភាព",
    refreshedRecently: "បានធ្វើបច្ចុប្បន្នភាពថ្មីៗនេះ",
    refreshed: "បានធ្វើបច្ចុប្បន្នភាព",
    pleaseWait: (minutes: number) => `សូមរង់ចាំ ${minutes} នាទី`,
    couldntReach: "សូមព្យាយាមម្តងទៀត",
    couldntRefresh: "សូមព្យាយាមម្តងទៀត",
  },
  stat: {
    totalHoldings: "ទ្រព្យសម្បត្តិសរុប",
    averageCost: "ថ្លៃដើមមធ្យម",
    marketValue: "តម្លៃទីផ្សារ",
    gainLoss: "ចំណេញ/ខាត",
    atCurrentSpot: "តាមតម្លៃទីផ្សារបច្ចុប្បន្ន",
    per: (unit: string) => `ក្នុងមួយ${unit}`,
  },
  transactions: {
    title: "ប្រវត្តិប្រតិបត្តិការ",
    addTransaction: "បញ្ចូលប្រតិបត្តិការ",
    date: "កាលបរិច្ឆេទ",
    quantity: "បរិមាណ",
    paid: "បានបង់",
    currentValue: "តម្លៃបច្ចុប្បន្ន",
    pnl: "ចំណេញ/ខាត",
    buy: "ទិញ",
    sell: "លក់",
    saving: "កំពុងរក្សាទុក…",
    edit: "កែសម្រួល",
    delete: "លុប",
    cancel: "បោះបង់",
    actionsFor: (type: string, quantity: string, unit: string) =>
      `សកម្មភាពសម្រាប់ការ${type} ${quantity} ${unit}`,
    khrNote: "ធាតុគិតជារៀលមិនទាន់បានបំប្លែងទៅជាដុល្លារនៅឡើយទេ",
    sellNote: "ជួរលក់បង្ហាញប្រាក់ចំណូល មិនមែនជាមូលដ្ឋានកាន់កាប់បន្តទេ",
  },
  dialog: {
    editTitle: "កែសម្រួលប្រតិបត្តិការ",
    addTitle: "បញ្ចូលប្រតិបត្តិការ",
    editDescription: "កែប្រែព័ត៌មានលម្អិតនៃប្រតិបត្តិការនេះ។",
    addDescription: "កត់ត្រាការទិញ ឬលក់ធៀបនឹងទ្រព្យសម្បត្តិមាសរបស់អ្នក។",
    quantity: "បរិមាណ",
    pricePerUnit: "តម្លៃក្នុងមួយឯកតា",
    totalCost: "ថ្លៃដើមសរុប",
    currentSpot: "តម្លៃទីផ្សារបច្ចុប្បន្ន",
    date: "កាលបរិច្ឆេទ",
    notes: "កំណត់ចំណាំ (មិនចាំបាច់)",
    saveTransaction: "រក្សាទុកប្រតិបត្តិការ",
    savingChanges: "កំពុងរក្សាទុកការផ្លាស់ប្តូរ…",
    savingTransaction: "កំពុងរក្សាទុកប្រតិបត្តិការ…",
    exceedsHoldings: (quantity: string, unit: string) =>
      `លើសពីទ្រព្យសម្បត្តិបច្ចុប្បន្នរបស់អ្នកចំនួន ${quantity} ${unit}។`,
    couldntSave:
      "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ — ប្រតិបត្តិការមិនត្រូវបានរក្សាទុកឡើយ។",
    somethingWrong: "មានបញ្ហាកើតឡើង",
  },
  empty: {
    title: "មិនទាន់មានទ្រព្យសម្បត្តិទេ",
    description:
      "កត់ត្រាការទិញដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើមតាមដានមាសរបស់អ្នកធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
  },
  chart: {
    notEnoughHistory:
      "ប្រវត្តិតម្លៃមិនទាន់គ្រប់គ្រាន់នៅឡើយទេ — សូមពិនិត្យម្តងទៀតបន្ទាប់ពីធ្វើបច្ចុប្បន្នភាពពីរបីដង។",
  },
  welcome: {
    nav: {
      features: "លក្ខណៈពិសេស",
      how: "របៀបដំណើរការ",
      signIn: "ចូលគណនី",
      getStarted: "ចាប់ផ្តើម",
      goToDashboard: "ទៅផ្ទាំងគ្រប់គ្រង",
    },
    hero: {
      eyebrow: "កម្មវិធីតាមដានមាសផ្ទាល់ខ្លួន",
      headline: "មើលឃើញតម្លៃពិតប្រាកដនៃមាសរបស់អ្នក",
      subhead:
        "កត់ត្រាការទិញ និងលក់ជាជី និងដំឡឹង។ GoldKh គណនាថ្លៃដើមមធ្យម តម្លៃទីផ្សារបច្ចុប្បន្ន និងចំណេញ ឬខាតដែលមិនទាន់សម្រេច ធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
      trustLine:
        "គ្មានប្រាក់ឆ្លងកាត់ GoldKh ទេ — វាជាកម្មវិធីតាមដាន មិនមែនកន្លែងជួរដូរ។",
      sampleTag: "គំរូ",
    },
    trust: {
      notExchange: "មិនមែនកន្លែងជួរដូរ",
      noMoney: "គ្មានប្រាក់ឆ្លងកាត់",
      dataYours: "ទិន្នន័យរបស់អ្នក សម្រាប់តែអ្នក",
      units: "ដុល្លារ ជី និងដំឡឹង",
    },
    features: {
      kicker: "លក្ខណៈពិសេស",
      title: "បង្កើតឡើងសម្រាប់របៀបដែលអ្នកកាន់កាប់មាសពិតប្រាកដ",
      avgCostTitle: "ថ្លៃដើមមធ្យមថ្លឹងទម្ងន់",
      avgCostBody:
        "រាល់ការទិញធ្វើបច្ចុប្បន្នភាពថ្លៃដើមពិតរបស់អ្នក។ ការលក់កាត់បន្ថយមូលដ្ឋានកាន់កាប់ ដោយមិនផ្លាស់ប្តូរថ្លៃដើមនៃចំណែកដែលនៅសល់។",
      livePriceTitle: "តម្លៃដែលមានជានិច្ច",
      livePriceBody:
        "តម្លៃទីផ្សារត្រូវបានរក្សាទុក និងដាក់ម៉ោង។ បើគ្រប់ប្រភពដាច់ អ្នកនៅតែឃើញតម្លៃចុងក្រោយ និងថាវាចាស់ប៉ុណ្ណា — មិនដែលមានអេក្រង់ទទេទេ។",
      unitsTitle: "ជី និងដំឡឹងដោយផ្ទាល់",
      unitsBody:
        "បញ្ចូលបរិមាណតាមរបៀបដែលហាងមាសនៅកម្ពុជាកំណត់តម្លៃ។ តម្លៃចម្បងគិតជាដំឡឹង ជាមួយនឹងជី និងអោនស៍ក្បែរនោះ។",
      bilingualTitle: "អង់គ្លេស និងខ្មែរ",
      bilingualBody:
        "ប្តូរចំណុចប្រទាក់ទាំងមូលរវាងអង់គ្លេស និងខ្មែរនៅពេលណាក៏បាន។ លេខរបស់អ្នកនៅតែជាតួលេខតារាងដដែល។",
    },
    steps: {
      kicker: "របៀបដំណើរការ",
      title: "តាមដានក្នុងបីជំហាន",
      oneTitle: "ចូលគណនី",
      oneBody:
        "បង្កើតគណនីជាមួយ Clerk។ ទ្រព្យសម្បត្តិរបស់អ្នកមើលឃើញតែអ្នកម្នាក់ប៉ុណ្ណោះ។",
      twoTitle: "កត់ត្រាការទិញ និងលក់",
      twoBody:
        "បរិមាណ ឯកតា តម្លៃដែលបានបង់ និងកាលបរិច្ឆេទ។ កែ ឬលុបពេលក្រោយបាន។",
      threeTitle: "តាមដានមូលដ្ឋានកាន់កាប់",
      threeBody:
        "ទ្រព្យសម្បត្តិ តម្លៃទីផ្សារ និងចំណេញ ឬខាតមិនទាន់សម្រេច ធ្វើបច្ចុប្បន្នភាពធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
    },
    cta: {
      title: "ចាប់ផ្តើមតាមដានមាសរបស់អ្នកថ្ងៃនេះ",
      body:
        "ប្រើប្រាស់ដោយឥតគិតថ្លៃ។ គ្មានប្រាក់ឆ្លងកាត់ប្រព័ន្ធទេ — គ្រាន់តែជារូបភាពច្បាស់នៃអ្វីដែលអ្នកកាន់កាប់។",
      button: "ចាប់ផ្តើម",
    },
    footer: {
      tagline: "ទ្រព្យសម្បត្តិមាសផ្ទាល់ខ្លួន តាមដានធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
      notExchange: "មិនមែនកន្លែងជួរដូរ។ គ្មានប្រាក់ឆ្លងកាត់ប្រព័ន្ធនេះទេ។",
      source: "កូដប្រភព",
      rights: "© 2026 GoldKh",
    },
  },
};

export const dictionary = { en, km } as const;
export type Dictionary = typeof en;
