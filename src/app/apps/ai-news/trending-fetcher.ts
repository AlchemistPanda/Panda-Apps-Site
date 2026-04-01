import type { NewsItem, TrendPeriod } from "./types";

// ── AI-only subreddits ────────────────────────────────────────────────────────
// Only communities focused specifically on AI — no general tech or world news.
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

// HN search query — strict AI keywords only
const HN_AI_QUERY =
  "AI OR LLM OR GPT OR Claude OR Gemini OR ChatGPT OR Anthropic OR OpenAI OR " +
  "machine learning OR neural network OR deep learning OR transformer OR AGI OR " +
  "Mistral OR Llama OR diffusion OR embeddings OR RAG OR fine-tuning";

const PERIOD_SECONDS: Record<TrendPeriod, number> = {
  day: 86_400,
  week: 604_800,
  month: 2_592_000,
};

// ── Reddit (public JSON API, no auth needed) ─────────────────────────────────

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
    domain: string;
  };
}

async function fetchRedditSubreddit(
  subreddit: string,
  period: TrendPeriod
): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/top.json?t=${period}&limit=10`,
      {
        headers: {
          "User-Agent": "PandaApps-NewsBot/1.0 (https://pandaapps.com)",
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];

    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    return posts
      .filter((p) => {
        // Skip self-posts with no external link (usually just discussions)
        // and skip posts with a score below a minimum threshold
        return p.data.score > 5;
      })
      .map((p) => {
        const post = p.data;
        // For self-posts, link to the Reddit thread
        const url = post.is_self
          ? `https://www.reddit.com${post.permalink}`
          : post.url;

        const excerpt =
          post.is_self && post.selftext
            ? post.selftext.slice(0, 220).replace(/\s+/g, " ").trim() + "…"
            : `${post.score.toLocaleString()} upvotes · ${post.num_comments.toLocaleString()} comments on r/${subreddit}`;

        return {
          id: `reddit-${post.id}`,
          title: post.title,
          url,
          excerpt,
          source: `r/${subreddit}`,
          sourceId: `reddit-${subreddit.toLowerCase()}`,
          sourceType: "news" as const,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          score: post.score,
          commentCount: post.num_comments,
        } satisfies NewsItem;
      });
  } catch {
    return [];
  }
}

// ── Hacker News (Algolia API) ─────────────────────────────────────────────────

interface HNHit {
  objectID: string;
  title: string;
  url?: string;
  points: number;
  num_comments: number;
  created_at: string;
}

async function fetchHNTrending(period: TrendPeriod): Promise<NewsItem[]> {
  try {
    const since = Math.floor(Date.now() / 1000) - PERIOD_SECONDS[period];
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        HN_AI_QUERY
      )}&tags=story&hitsPerPage=30&numericFilters=created_at_i>${since},points>5`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];

    const data: { hits: HNHit[] } = await res.json();

    return (data.hits ?? [])
      .filter((h) => h.url && h.title && h.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 15)
      .map((h) => ({
        id: `hn-trend-${h.objectID}`,
        title: h.title,
        url: h.url!,
        excerpt: `${h.points.toLocaleString()} points · ${h.num_comments.toLocaleString()} comments on Hacker News`,
        source: "Hacker News",
        sourceId: "hacker-news",
        sourceType: "news" as const,
        publishedAt: h.created_at,
        score: h.points,
        commentCount: h.num_comments,
      }));
  } catch {
    return [];
  }
}

// ── Engagement score: upvotes + weighted comments ────────────────────────────

function engagementScore(item: NewsItem): number {
  return (item.score ?? 0) + (item.commentCount ?? 0) * 2;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchTrending(period: TrendPeriod): Promise<NewsItem[]> {
  const [hn, ...redditResults] = await Promise.allSettled([
    fetchHNTrending(period),
    ...AI_SUBREDDITS.map((s) => fetchRedditSubreddit(s, period)),
  ]);

  const all: NewsItem[] = [];
  if (hn.status === "fulfilled") all.push(...hn.value);
  for (const r of redditResults) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by URL, then rank by engagement
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
