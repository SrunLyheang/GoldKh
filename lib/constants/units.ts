// Matches Cambodian gold-market convention (per the Vietnamese "chỉ"),
// but not yet checked against a live Cambodian shop or exchange quote.
export const GRAMS_PER_CHI = 3.75;

export const GRAMS_PER_TROY_OZ = 31.1034768;

// 1 damlung = 10 chi.
export const CHI_PER_DAMLUNG = 10;

export const GRAMS_PER_DAMLUNG = GRAMS_PER_CHI * CHI_PER_DAMLUNG;

export const CHI_PER_TROY_OZ = GRAMS_PER_TROY_OZ / GRAMS_PER_CHI;

export const DAMLUNG_PER_TROY_OZ = GRAMS_PER_TROY_OZ / GRAMS_PER_DAMLUNG;
