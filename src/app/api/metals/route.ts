import { NextResponse } from "next/server";

// Revalidate every 30 minutes — ISR caches the response on the edge
export const revalidate = 1800;

export async function GET() {
  try {
    const TROY_OZ_TO_G = 31.1035;
    const apiKey = process.env.GOLDAPI_KEY;
    let goldUsdPerOz: number = 0;
    let silverUsdPerOz: number = 0;
    let usdInr: number = 92.15; // fallback rate
    let source = "";

    // Try goldapi.io first if API key is configured
    if (apiKey) {
      try {
        const [goldRes, silverRes] = await Promise.all([
          fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
            next: { revalidate: 1800 },
          }),
          fetch("https://www.goldapi.io/api/XAG/USD", {
            headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
            next: { revalidate: 1800 },
          }),
        ]);

        if (goldRes.ok && silverRes.ok) {
          const [goldData, silverData] = await Promise.all([goldRes.json(), silverRes.json()]);
          goldUsdPerOz = goldData.price;
          silverUsdPerOz = silverData.price;
          source = "goldapi.io";
        }
      } catch (err) {
        console.warn("[/api/metals] goldapi.io failed:", err);
      }
    }

    // Fallback: Try metals.live API (free, no key required)
    if (!goldUsdPerOz) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const [goldRes, silverRes] = await Promise.all([
          fetch("https://api.metals.live/v1/spot/gold", { 
            signal: controller.signal,
            next: { revalidate: 1800 } 
          }).catch(err => {
            console.warn("[/api/metals] metals.live gold fetch failed:", err.message);
            return null;
          }),
          fetch("https://api.metals.live/v1/spot/silver", { 
            signal: controller.signal,
            next: { revalidate: 1800 } 
          }).catch(err => {
            console.warn("[/api/metals] metals.live silver fetch failed:", err.message);
            return null;
          }),
        ]);

        clearTimeout(timeoutId);

        if (goldRes?.ok && silverRes?.ok) {
          const [goldData, silverData] = await Promise.all([
            goldRes.json().catch(() => null),
            silverRes.json().catch(() => null),
          ]);
          if (goldData?.price) goldUsdPerOz = goldData.price;
          if (silverData?.price) silverUsdPerOz = silverData.price;
          if (goldUsdPerOz > 0) source = "metals.live";
        }
      } catch (err) {
        console.warn("[/api/metals] metals.live fallback failed:", err);
      }
    }

    // Fallback: Try frankfurter.dev for USD/INR rate
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const fxRes = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR", {
        signal: controller.signal,
        next: { revalidate: 1800 },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (fxRes?.ok) {
        const fx = await fxRes.json().catch(() => null);
        if (fx?.rates?.INR) usdInr = fx.rates.INR;
      }
    } catch (err) {
      console.warn("[/api/metals] forex fetch failed:", err);
    }

    // If we still don't have prices, use values calculated for ₹15,547/gram target in India
    if (!goldUsdPerOz) {
      // Target: ₹15,547/gram for gold in India
      // Calculate USD/oz based on current USD/INR rate: USD/oz = Target INR × 31.1035 grams/oz ÷ USD/INR rate
      goldUsdPerOz = (15547 * TROY_OZ_TO_G) / usdInr; // Dynamically calculated for current FX rate
      silverUsdPerOz = goldUsdPerOz / 90; // ~56-60 range depending on FX
      source = "fallback (India ₹15,547/gram target)";
      console.warn("[/api/metals] Using fallback prices. Live API sources unavailable. Calculated for ₹15,547/gram target.");
    }

    // Sanity-check silver: gold/silver ratio should be 30–150
    const ratio = goldUsdPerOz / silverUsdPerOz;
    if (ratio < 30 || ratio > 150) {
      silverUsdPerOz = goldUsdPerOz / 90; // fallback to ~ratio 90
    }

    // INR per gram = usd_per_oz / troy_oz_per_gram * usd_inr
    const goldInrPerGram = (goldUsdPerOz / TROY_OZ_TO_G) * usdInr;
    const silverInrPerGram = (silverUsdPerOz / TROY_OZ_TO_G) * usdInr;

    return NextResponse.json({
      gold: { usdPerOz: goldUsdPerOz, inrPerGram: Math.round(goldInrPerGram) },
      silver: { usdPerOz: silverUsdPerOz, inrPerGram: Math.round(silverInrPerGram * 100) / 100 },
      usdInr,
      updatedAt: new Date().toISOString(),
      source: `${source} + frankfurter.dev`,
    });
  } catch (err) {
    console.error("[/api/metals] Unexpected error:", err);
    // Return a safe fallback
    const TROY_OZ_TO_G = 31.1035;
    const usdInr = 92.15;
    const goldUsdPerOz = 5237;
    const silverUsdPerOz = 59;
    return NextResponse.json({
      gold: { usdPerOz: goldUsdPerOz, inrPerGram: Math.round((goldUsdPerOz / TROY_OZ_TO_G) * usdInr) },
      silver: { usdPerOz: silverUsdPerOz, inrPerGram: Math.round(((silverUsdPerOz / TROY_OZ_TO_G) * usdInr) * 100) / 100 },
      usdInr,
      updatedAt: new Date().toISOString(),
      source: "fallback (emergency)",
      note: "Live API sources unavailable - using fallback prices"
    });
  }
}
