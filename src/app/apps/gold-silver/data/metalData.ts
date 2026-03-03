// ── Current spot prices (as of 4 March 2026) ─────────────────────────────────
// International prices in USD; India prices in INR.
// Gold is quoted per troy ounce (31.1035 g). Silver similarly.
// USD/INR rate used: 84.50

export const DATA_DATE = "4 March 2026";
export const USD_INR   = 84.50;

// Troy oz → gram conversion
export const TROY_OZ_TO_G  = 31.1035;
// 1 tola = 11.6638 grams (Indian standard)
export const TOLA_TO_G     = 11.6638;

// ── Current prices ────────────────────────────────────────────────────────────
export type MetalSpot = {
  /** USD per troy ounce */
  usdPerOz:   number;
  /** INR per gram (24K for gold, pure for silver) */
  inrPerGram: number;
};

export const GOLD_SPOT: MetalSpot  = { usdPerOz: 3105.40, inrPerGram: 8453.0  };
export const SILVER_SPOT: MetalSpot = { usdPerOz: 33.85,  inrPerGram:  91.80 };

// Derived helpers
export function goldInr22k(inrPerGram24k: number) {
  return (inrPerGram24k * 22) / 24;
}

// ── Historical trend data (monthly, international spot) ───────────────────────
export type TrendPoint = { month: string; gold: number; silver: number };

// International spot prices in USD per troy ounce, approx monthly averages.
export const METAL_TREND: TrendPoint[] = [
  { month: "Sep '24", gold: 2540, silver: 29.10 },
  { month: "Oct '24", gold: 2713, silver: 32.40 },
  { month: "Nov '24", gold: 2660, silver: 31.20 },
  { month: "Dec '24", gold: 2625, silver: 29.60 },
  { month: "Jan '25", gold: 2735, silver: 30.50 },
  { month: "Feb '25", gold: 2830, silver: 31.80 },
  { month: "Mar '25", gold: 2890, silver: 32.30 },
  { month: "Apr '25", gold: 3230, silver: 32.60 },
  { month: "May '25", gold: 3190, silver: 32.20 },
  { month: "Jun '25", gold: 3250, silver: 33.40 },
  { month: "Jul '25", gold: 3330, silver: 34.10 },
  { month: "Aug '25", gold: 3410, silver: 33.70 },
  { month: "Sep '25", gold: 3290, silver: 31.90 },
  { month: "Oct '25", gold: 3220, silver: 32.50 },
  { month: "Nov '25", gold: 3150, silver: 31.40 },
  { month: "Dec '25", gold: 3060, silver: 30.80 },
  { month: "Jan '26", gold: 2950, silver: 31.20 },
  { month: "Feb '26", gold: 3010, silver: 32.40 },
  { month: "Mar '26", gold: 3105, silver: 33.85 },
];
