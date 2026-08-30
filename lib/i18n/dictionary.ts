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

const km: typeof en = {
  language: { en: "អង់គ្លេស", km: "ខ្មែរ" },
  nav: { dashboard: "ផ្ទាំងគ្រប់គ្រង" },
  hero: {
    pricePer: (unit: string) => `តម្លៃមួយ${unit}`,
    live: "ទាន់សម័យ",
    stale: "តម្លៃចាស់",
    asOf: (time: string) => `គិតត្រឹមម៉ោង ${time}`,
    marketClosed: "ទីផ្សារបិទ — តម្លៃនឹងបន្តនៅថ្ងៃច័ន្ទ។",
    disclaimer:
      "ហាងមាសនៅស្រុកខ្មែរកំណត់តម្លៃខុសពីតម្លៃទីផ្សារពិភពលោកដែលបង្ហាញនៅទីនេះ ដូច្នេះតម្លៃទិញ ឬលក់នៅផ្សារក្នុងស្រុក អាចខុសគ្នាខ្លះ។",
  },
  unit: { chi: "ជី", damlung: "ដំឡឹង" },
  refresh: {
    label: "ផ្ទុកតម្លៃឡើងវិញ",
    refreshedRecently: "ទើបតែផ្ទុកឡើងវិញ",
    refreshed: "ផ្ទុកឡើងវិញរួច",
    pleaseWait: (minutes: number) => `សូមរង់ចាំ ${minutes} នាទីសិន`,
    couldntReach: "ភ្ជាប់ម៉ាស៊ីនមេមិនបាន — សូមព្យាយាមម្ដងទៀតបន្តិចទៀត",
    couldntRefresh: "ផ្ទុកតម្លៃឡើងវិញមិនបាន — សូមព្យាយាមម្ដងទៀតបន្តិចទៀត",
    marketClosed: "ទីផ្សារបិទ — តម្លៃនឹងបន្តនៅថ្ងៃច័ន្ទ",
  },
  stat: {
    totalHoldings: "មាសសរុបដែលកាន់កាប់",
    averageCost: "តម្លៃដើមមធ្យម",
    marketValue: "តម្លៃទីផ្សារ",
    gainLoss: "ចំណេញ/ខាត មិនទាន់សម្រេច",
    atCurrentSpot: "តាមតម្លៃទីផ្សារបច្ចុប្បន្ន",
    per: (unit: string) => `ក្នុងមួយ${unit}`,
  },
  transactions: {
    title: "ប្រវត្តិប្រតិបត្តិការ",
    addTransaction: "បន្ថែមប្រតិបត្តិការ",
    date: "កាលបរិច្ឆេទ",
    quantity: "បរិមាណ",
    paid: "ប្រាក់បានបង់",
    currentValue: "តម្លៃបច្ចុប្បន្ន",
    pnl: "ចំណេញ/ខាត",
    buy: "ទិញ",
    sell: "លក់",
    saving: "កំពុងរក្សាទុក…",
    edit: "កែ",
    delete: "លុប",
    cancel: "បោះបង់",
    actionsFor: (type: string, quantity: string, unit: string) =>
      `សកម្មភាពសម្រាប់ការ${type} ${quantity} ${unit}`,
    khrNote: "ប្រតិបត្តិការជាប្រាក់រៀល មិនទាន់បម្លែងទៅជាដុល្លារនៅឡើយទេ",
    sellNote: "ជួរលក់បង្ហាញប្រាក់ដែលទទួលបាន មិនមែនបរិមាណមាសដែលនៅកាន់កាប់ទេ",
    priceOffSpot:
      "តម្លៃនេះឆ្ងាយពីតម្លៃទីផ្សារបច្ចុប្បន្ន — វាអាចជាការវាយខុស។ សូមកែប្រតិបត្តិការនេះ។",
  },
  dialog: {
    editTitle: "កែប្រតិបត្តិការ",
    addTitle: "បន្ថែមប្រតិបត្តិការ",
    editDescription: "កែប្រែព័ត៌មានលម្អិតរបស់ប្រតិបត្តិការនេះ។",
    addDescription: "កត់ត្រាការទិញ ឬការលក់មាសរបស់អ្នក។",
    quantity: "បរិមាណ",
    totalPaid: "ចំនួនប្រាក់សរុបដែលបានបង់",
    perUnitEquiv: (unit: string) => `តម្លៃក្នុងមួយ ${unit}`,
    currentSpot: "តម្លៃទីផ្សារបច្ចុប្បន្ន",
    priceHardLow:
      "តម្លៃនេះតិចជាងមួយភាគដប់នៃតម្លៃទីផ្សារបច្ចុប្បន្ន។ សូមពិនិត្យចំនួនប្រាក់សរុប និងបរិមាណ មុននឹងរក្សាទុក។",
    priceHardHigh:
      "តម្លៃនេះច្រើនជាងដប់ដងនៃតម្លៃទីផ្សារបច្ចុប្បន្ន។ សូមពិនិត្យចំនួនប្រាក់សរុប និងបរិមាណ មុននឹងរក្សាទុក។",
    priceSoftLow:
      "តម្លៃនេះទាបជាងតម្លៃទីផ្សារបច្ចុប្បន្នច្រើន — សូមពិនិត្យចំនួនប្រាក់សរុបម្តងទៀត បើមិនរំពឹងទុក។",
    priceSoftHigh:
      "តម្លៃនេះខ្ពស់ជាងតម្លៃទីផ្សារបច្ចុប្បន្នច្រើន — សូមពិនិត្យចំនួនប្រាក់សរុបម្តងទៀត បើមិនរំពឹងទុក។",
    date: "កាលបរិច្ឆេទ",
    notes: "កំណត់ចំណាំ (បើចង់)",
    saveTransaction: "រក្សាទុកប្រតិបត្តិការ",
    savingChanges: "កំពុងរក្សាទុកការកែប្រែ…",
    savingTransaction: "កំពុងរក្សាទុកប្រតិបត្តិការ…",
    exceedsHoldings: (quantity: string, unit: string) =>
      `លើសពីមាសដែលអ្នកកាន់កាប់បច្ចុប្បន្ន ${quantity} ${unit}។`,
    couldntSave: "ភ្ជាប់ម៉ាស៊ីនមេមិនបាន — ប្រតិបត្តិការមិនបានរក្សាទុកទេ។",
    somethingWrong: "មានបញ្ហាបានកើតឡើង",
  },
  empty: {
    title: "មិនទាន់មានមាសនៅឡើយទេ",
    description:
      "កត់ត្រាការទិញលើកដំបូងរបស់អ្នក ដើម្បីចាប់ផ្ដើមតាមដានតម្លៃមាសរបស់អ្នកធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
  },
  chart: {
    notEnoughHistory:
      "ប្រវត្តិតម្លៃមិនទាន់មានគ្រប់គ្រាន់ទេ — សូមពិនិត្យមើលម្ដងទៀត បន្ទាប់ពីផ្ទុកតម្លៃឡើងវិញពីរបីដង។",
    marketClosed: "ទីផ្សារបិទ",
    marketClosedNote:
      "កំពុងបង្ហាញតម្លៃចុងក្រោយពីថ្ងៃសុក្រ។ ការជួញដូរនឹងបើកឡើងវិញនៅថ្ងៃច័ន្ទ។",
  },
  realized: {
    eyebrow: "ចំណេញ/ខាតសម្រេច",
    fromSales: (count: number) => `ពីការលក់ ${count} ដង`,
    caption:
      "ប្រាក់ដែលអ្នកទទួលបានច្បាស់លាស់ពីការលក់មាស ធៀបនឹងតម្លៃដើមដែលអ្នកបានបង់។ មាសដែលអ្នកនៅកាន់កាប់ មិនរាប់បញ្ចូលនៅទីនេះទេ — នោះជាតួលេខមិនទាន់សម្រេចខាងលើ។",
  },
  welcome: {
    nav: {
      features: "លក្ខណៈពិសេស",
      how: "របៀបប្រើ",
      signIn: "ចូលគណនី",
      getStarted: "ចាប់ផ្ដើម",
      goToDashboard: "ទៅផ្ទាំងគ្រប់គ្រង",
    },
    hero: {
      eyebrow: "កម្មវិធីតាមដានមាសផ្ទាល់ខ្លួន",
      headline: "ដឹងច្បាស់ថាមាសរបស់អ្នកមានតម្លៃប៉ុន្មានពិតប្រាកដ",
      subhead:
        "កត់ត្រាការទិញ និងការលក់មាសរបស់អ្នកជាជី និងដំឡឹង។ GoldKh គណនាតម្លៃដើមមធ្យម តម្លៃទីផ្សារបច្ចុប្បន្ន ព្រមទាំងចំណេញ ឬខាតដែលអ្នកមិនទាន់សម្រេច ធៀបនឹងតម្លៃមាសផ្ទាល់។",
      sampleTag: "គំរូ",
    },
    trust: {
      notExchange: "មិនមែនកន្លែងជួញដូរ",
      noMoney: "គ្មានប្រាក់ឆ្លងកាត់",
      dataYours: "ទិន្នន័យរបស់អ្នក សម្រាប់តែអ្នក",
      units: "ដុល្លារ ជី និងដំឡឹង",
    },
    features: {
      kicker: "លក្ខណៈពិសេស",
      title: "រចនាឡើងតាមរបៀបដែលអ្នកកាន់កាប់មាសពិតៗ",
      avgCostTitle: "តម្លៃដើមមធ្យមតាមទម្ងន់",
      avgCostBody:
        "រាល់ការទិញម្ដងៗ នឹងធ្វើឱ្យតម្លៃដើមពិតរបស់អ្នកប្រែប្រួល។ រីឯការលក់ គ្រាន់តែបន្ថយបរិមាណមាសដែលអ្នកកាន់កាប់ ដោយមិនប៉ះពាល់ដល់តម្លៃដើមនៃមាសដែលនៅសល់ឡើយ។",
      livePriceTitle: "តម្លៃដែលមានឱ្យមើលជានិច្ច",
      livePriceBody:
        "តម្លៃទីផ្សារត្រូវបានរក្សាទុក ព្រមទាំងកត់ម៉ោងច្បាស់លាស់។ បើប្រភពទាំងអស់ដាច់ អ្នកនៅតែឃើញតម្លៃចុងក្រោយបំផុត និងដឹងថាវាចាស់ប៉ុន្មាន — មិនដែលឃើញអេក្រង់ទទេឡើយ។",
      unitsTitle: "គិតជាជី និងដំឡឹងតែម្ដង",
      unitsBody:
        "បញ្ចូលបរិមាណតាមរបៀបដែលហាងមាសនៅស្រុកខ្មែរគេនិយាយ។ តម្លៃសំខាន់គិតជាដំឡឹង រួមមានជី និងអោនស៍ (troy ounce) នៅជាប់គ្នាផង។",
      bilingualTitle: "អង់គ្លេស និងខ្មែរ",
      bilingualBody:
        "ប្ដូរភាសាទាំងកម្មវិធីរវាងអង់គ្លេស និងខ្មែរបានគ្រប់ពេល។ លេខទាំងអស់នៅតែតម្រៀបស្មើគ្នាជាតួលេខតារាងដដែល។",
    },
    steps: {
      kicker: "របៀបប្រើ",
      title: "តាមដានបានក្នុងបីជំហានប៉ុណ្ណោះ",
      oneTitle: "ចូលគណនី",
      oneBody: "បង្កើតគណនី។ មានតែអ្នកម្នាក់ប៉ុណ្ណោះ ដែលអាចមើលឃើញមាសរបស់អ្នក។",
      twoTitle: "កត់ត្រាការទិញ និងការលក់",
      twoBody:
        "បំពេញបរិមាណ ឯកតា តម្លៃដែលបានបង់ និងកាលបរិច្ឆេទ។ ចង់កែ ឬលុបពេលក្រោយក៏បាន។",
      threeTitle: "តាមដានស្ថានភាពមាសរបស់អ្នក",
      threeBody:
        "បរិមាណមាស តម្លៃទីផ្សារ និងចំណេញ ឬខាតដែលមិនទាន់សម្រេច នឹងប្រែប្រួលទៅតាមតម្លៃមាសផ្ទាល់។",
    },
    cta: {
      title: "ចាប់ផ្ដើមតាមដានមាសរបស់អ្នកឥឡូវនេះ",
      body: "ប្រើដោយឥតគិតថ្លៃ — ជួយឱ្យអ្នកមើលឃើញច្បាស់ថាអ្នកកាន់កាប់មាសប៉ុន្មាន។",
      button: "ចាប់ផ្ដើម",
    },
    footer: {
      tagline: "តាមដានមាសផ្ទាល់ខ្លួនរបស់អ្នក ធៀបនឹងតម្លៃទីផ្សារផ្ទាល់។",
      notExchange: "មិនមែនកន្លែងជួញដូរទេ។ គ្មានប្រាក់ឆ្លងកាត់ប្រព័ន្ធនេះឡើយ។",
      source: "ប្រភពកូដ",
      rights: "© 2026 GoldKh",
    },
  },
};

export const dictionary = { en, km } as const;
export type Dictionary = typeof en;
