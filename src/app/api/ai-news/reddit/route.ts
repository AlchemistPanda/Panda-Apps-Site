import { NextResponse } from "next/server";
import { fetchRedditAI } from "@/app/apps/ai-news/reddit-fetcher";
import type { RedditSort } from "@/app/apps/ai-news/types";

export const revalidate = 3600; // 1 hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("sort") ?? "hot";
  const sort: RedditSort = ["hot", "new", "top"].includes(raw)
    ? (raw as RedditSort)
    : "hot";

  try {
    const items = await fetchRedditAI(sort);
    return NextResponse.json(
      { items, sort, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[api/reddit] Unexpected error:", err);
    return NextResponse.json(
      { items: [], sort, fetchedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
