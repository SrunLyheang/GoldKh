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
};

export const dictionary = { en, km } as const;
export type Dictionary = typeof en;
