import { NextResponse } from "next/server";

// Revalidate every 60 minutes — ISR caches the response on the edge
export const revalidate = 3600;

export async function GET() {
  try {
    const apiKey = process.env.GOLDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOLDAPI_KEY not configured" }, { status: 503 });
    }

    // Fetch gold price (XAU) and silver price (XAG) in USD, plus USD/INR — all in parallel
    const [goldRes, silverRes, fxRes] = await Promise.all([
      fetch("https://www.goldapi.io/api/XAU/USD", {
        headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      }),
      fetch("https://www.goldapi.io/api/XAG/USD", {
        headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      }),
      fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR", {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!goldRes.ok || !silverRes.ok || !fxRes.ok) {
      throw new Error(`Upstream error: gold=${goldRes.status} silver=${silverRes.status} fx=${fxRes.status}`);
    }

    const [gold, silver, fx] = await Promise.all([
      goldRes.json(),
      silverRes.json(),
      fxRes.json(),
    ]);

    const usdInr: number = fx.rates?.INR ?? 87.0;

    const goldUsdPerOz: number = gold.price;

    // Sanity-check silver: gold/silver ratio should be 40–120.
    // GoldAPI free tier sometimes returns stale/incorrect XAG data.
    const rawSilver: number = silver.price;
    const ratio = goldUsdPerOz / rawSilver;
    const silverUsdPerOz = ratio >= 30 && ratio <= 150 ? rawSilver : goldUsdPerOz / 90; // fallback to ~ratio 90

    // INR per gram = usd_per_oz / troy_oz_per_gram * usd_inr
    const TROY_OZ_TO_G = 31.1035;
    const goldInrPerGram   = (goldUsdPerOz   / TROY_OZ_TO_G) * usdInr;
    const silverInrPerGram = (silverUsdPerOz / TROY_OZ_TO_G) * usdInr;

    return NextResponse.json({
      gold:      { usdPerOz: goldUsdPerOz,   inrPerGram: Math.round(goldInrPerGram)   },
      silver:    { usdPerOz: silverUsdPerOz,  inrPerGram: Math.round(silverInrPerGram * 100) / 100 },
      usdInr,
      updatedAt: new Date().toISOString(),
      source:    "goldapi.io + frankfurter.dev",
    });
  } catch (err) {
    console.error("[/api/metals]", err);
    return NextResponse.json({ error: "Failed to fetch live prices" }, { status: 502 });
  }
}
