import { NextResponse } from "next/server";
import { fetchAllNews } from "@/app/apps/ai-news/rss-fetcher";
import { SOURCES } from "@/app/apps/ai-news/sources";

export const revalidate = 3600; // 1 hour

export async function GET() {
  const items = await fetchAllNews();
  return NextResponse.json(
    {
      items,
      sources: SOURCES,
      fetchedAt: new Date().toISOString(),
      totalCount: items.length,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  );
}
