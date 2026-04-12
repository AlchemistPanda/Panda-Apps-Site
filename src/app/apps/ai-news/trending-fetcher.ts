import { isAIContent } from "./ai-filter";
import type { NewsItem, TrendPeriod } from "./types";

// ── AI-only subreddits ────────────────────────────────────────────────────────
const AI_SUBREDDITS = [
  "artificial",
  "MachineLearning",
  "LocalLLaMA",
  "ClaudeAI",
  "OpenAI",
  "singularity",
  "ChatGPT",
  "Bard",
];

// ── Reddit (public JSON API via old.reddit.com — more reliable) ───────────────

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext?: string;
    is_self: boolean;
    subreddit: string;
    thumbnail?: string;
    preview?: {
      images?: Array<{
        source?: { url?: string };
      }>;
    };
  };
}

async function fetchRedditSubreddit(
  subreddit: string,
  period: TrendPeriod
): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://old.reddit.com/r/${subreddit}/top.json?t=${period}&limit=10`,
      {
        headers: {
          "User-Agent": "PandaApps-NewsBot/1.0 (https://pandaapps.com)",
          "Accept": "application/json",
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.error(`[trending] r/${subreddit} responded ${res.status}`);
      return [];
    }

    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    return posts
      .filter((p) => {
        if (p.data.score <= 5) return false;
        const title = p.data.title || "";
        const selftext = p.data.selftext?.slice(0, 500) || "";
        return isAIContent(title, selftext);
      })
      .map((p) => {
        const post = p.data;
        const url = post.is_self
          ? `https://www.reddit.com${post.permalink}`
          : post.url;

        const excerpt =
          post.is_self && post.selftext
            ? post.selftext.slice(0, 220).replace(/\s+/g, " ").trim() + "…"
            : `${post.score.toLocaleString()} upvotes · ${post.num_comments.toLocaleString()} comments on r/${subreddit}`;

        // Extract best available image: preview > thumbnail
        const previewUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&");
        const thumb = post.thumbnail && post.thumbnail.startsWith("http") ? post.thumbnail : undefined;
        const imageUrl = previewUrl || thumb;

        return {
          id: `reddit-${post.id}`,
          title: post.title,
          url,
          excerpt,
          imageUrl,
          source: `r/${subreddit}`,
          sourceId: `reddit-${subreddit.toLowerCase()}`,
          sourceType: "news" as const,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          score: post.score,
          commentCount: post.num_comments,
        } satisfies NewsItem;
      });
  } catch (err) {
    console.error(`[trending] Failed to fetch r/${subreddit}:`, err);
    return [];
  }
}

// ── Engagement score: upvotes + weighted comments ────────────────────────────

function engagementScore(item: NewsItem): number {
  return (item.score ?? 0) + (item.commentCount ?? 0) * 2;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchTrending(period: TrendPeriod): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    AI_SUBREDDITS.map((s) => fetchRedditSubreddit(s, period))
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by URL, rank by upvotes + weighted comments
  const seen = new Set<string>();
  return all
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 20);
}
