// ── Current spot prices (as of 4 March 2026) ─────────────────────────────────
// International prices in USD; India prices in INR.
// Gold is quoted per troy ounce (31.1035 g). Silver similarly.
// USD/INR rate used: 84.50

export const DATA_DATE = "4 March 2026";
export const USD_INR   = 92.15;

// Troy oz → gram conversion
export const TROY_OZ_TO_G  = 31.1035;
// 1 tola = 11.6638 grams (Indian standard)
export const TOLA_TO_G     = 11.6638;

// ── Current prices ────────────────────────────────────────────────────────────
// Gold: ~$5,098/oz (goldprice.org, 4 Mar 2026). INR = spot × USD_INR.
// Silver: ~$33.85/oz. To enable live prices, add a /api/metals route handler
// that fetches from goldapi.io and revalidates every hour.
export type MetalSpot = {
  /** USD per troy ounce */
  usdPerOz:   number;
  /** INR per gram (24K for gold, pure for silver) — international spot × USD_INR */
  inrPerGram: number;
};

// Calculated: 5098.13 / 31.1035 * 92.15 = ₹15,105/g
export const GOLD_SPOT: MetalSpot  = { usdPerOz: 5098.13, inrPerGram: 15105  };
// Calculated: 82.48 / 31.1035 * 92.15 = ₹244.4/g (silver rose with gold bull market)
export const SILVER_SPOT: MetalSpot = { usdPerOz: 82.48,  inrPerGram: 244.4  };

// Derived helpers
export function goldInr22k(inrPerGram24k: number) {
  return (inrPerGram24k * 22) / 24;
}

// ── Historical trend data (monthly, international spot) ───────────────────────
export type TrendPoint = { month: string; gold: number; silver: number };

// Generates "Mon 'YY" labels starting from a given year/month (0-indexed)
function genMonths(startYear: number, startMonth: number, count: number): string[] {
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const out: string[] = [];
  let y = startYear, m = startMonth;
  for (let i = 0; i < count; i++) {
    out.push(`${M[m]} '${String(y).slice(2)}`);
    if (++m > 11) { m = 0; y++; }
  }
  return out;
}

// International spot prices in USD per troy ounce, approx monthly averages.
// Mar 2016 → Mar 2026 (121 points)
const GOLD_RAW = [
  // 2016 (Mar–Dec)
  1230,1250,1260,1320,1340,1340,1320,1270,1200,1160,
  // 2017
  1190,1240,1230,1280,1260,1250,1260,1290,1310,1280,1290,1300,
  // 2018
  1330,1330,1320,1330,1300,1270,1230,1200,1200,1220,1220,1250,
  // 2019
  1290,1320,1295,1290,1285,1390,1420,1520,1486,1490,1460,1475,
  // 2020
  1560,1590,1590,1680,1730,1730,1960,2070,1910,1900,1800,1885,
  // 2021
  1850,1810,1730,1780,1800,1790,1810,1820,1760,1790,1780,1800,
  // 2022
  1820,1870,1940,1960,1850,1840,1730,1750,1660,1650,1730,1800,
  // 2023
  1920,1860,1970,2020,1980,1940,1960,1950,1920,1990,1990,2060,
  // 2024
  2040,2050,2160,2340,2340,2330,2420,2500,2540,2713,2660,2625,
  // 2025
  2735,2830,2890,3230,3190,3250,3330,3410,3290,3220,3150,3060,
  // 2026 (Jan–Mar)
  2950,3010,3105,
];

const SILVER_RAW = [
  // 2016 (Mar–Dec)
  15.2,16.4,17.0,17.8,20.2,19.4,19.1,17.5,16.4,15.8,
  // 2017
  16.7,17.7,17.4,17.7,16.8,16.9,16.1,16.8,17.0,16.8,16.4,15.8,
  // 2018
  17.0,16.5,16.5,16.4,16.2,16.4,15.7,14.8,14.5,14.7,14.2,15.0,
  // 2019
  15.5,15.8,15.3,14.9,14.5,15.3,16.1,17.7,18.5,18.0,17.2,17.2,
  // 2020
  18.0,17.9,14.8,15.1,16.2,17.9,22.9,28.1,23.9,24.1,23.4,26.5,
  // 2021
  26.5,27.0,25.4,25.8,27.3,27.8,26.3,23.7,23.4,24.2,24.1,22.8,
  // 2022
  23.7,23.9,25.2,24.3,22.1,21.4,18.7,18.9,19.2,19.2,21.5,23.8,
  // 2023
  23.5,22.2,23.2,25.1,24.0,23.1,24.6,23.4,23.4,23.3,24.1,23.9,
  // 2024
  22.8,22.6,24.6,27.4,31.5,29.6,29.1,28.9,29.1,32.4,31.2,29.6,
  // 2025
  30.5,31.8,32.3,32.6,32.2,33.4,34.1,33.7,31.9,32.5,31.4,30.8,
  // 2026 (Jan–Mar)
  31.2,32.4,33.85,
];

const _MONTHS = genMonths(2016, 2, 121); // Mar 2016
export const METAL_TREND: TrendPoint[] = _MONTHS.map((month, i) => ({
  month,
  gold:   GOLD_RAW[i],
  silver: SILVER_RAW[i],
}));
