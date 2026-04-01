import { NextResponse } from "next/server";
import { fetchTrending } from "@/app/apps/ai-news/trending-fetcher";
import type { TrendPeriod } from "@/app/apps/ai-news/types";

// Refresh trending data every hour
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("period") ?? "day";
  const period: TrendPeriod = ["day", "week", "month"].includes(raw)
    ? (raw as TrendPeriod)
    : "day";

  const items = await fetchTrending(period);

  return NextResponse.json(
    { items, period, fetchedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  );
}
