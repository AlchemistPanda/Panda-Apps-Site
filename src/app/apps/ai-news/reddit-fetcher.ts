import { isAIContent } from "./ai-filter";
import type { NewsItem, RedditSort } from "./types";

export const REDDIT_AI_SUBREDDITS = [
  // ── Core AI/ML ──────────────────────────────────────────────────────────────
  "artificial",
  "MachineLearning",
  "deeplearning",
  "learnmachinelearning",
  "singularity",
  "AINews",
  "ArtificialIntelligence",

  // ── Local LLMs & open source ─────────────────────────────────────────────────
  "LocalLLaMA",
  "ollama",
  "oobabooga",

  // ── Vibe coding & AI coding tools ────────────────────────────────────────────
  "vibecoding",
  "ClaudeAI",
  "ClaudeCode",
  "ChatGPT",
  "OpenAI",
  "AIAssistants",
  "CursorAI",

  // ── Specific models & companies ──────────────────────────────────────────────
  "Bard",
  "Gemini",
  "grok",
  "Kling_AI",
  "midjourney",
  "StableDiffusion",
  "MediaSynthesis",

  // ── Chinese AI models (Qwen, Kimi, DeepSeek, GLM) ───────────────────────────
  "DeepSeek",
  "ChineseAI",

  // ── Benchmarking & evals ─────────────────────────────────────────────────────
  "LanguageModelEvals",
];

export const REDDIT_COLORS: Record<string, { bg: string; text: string }> = {
  // Core
  artificial:            { bg: "bg-rose-500/15",     text: "text-rose-400" },
  machinelearning:       { bg: "bg-indigo-500/15",   text: "text-indigo-400" },
  deeplearning:          { bg: "bg-violet-500/15",   text: "text-violet-400" },
  learnmachinelearning:  { bg: "bg-cyan-500/15",     text: "text-cyan-400" },
  singularity:           { bg: "bg-fuchsia-500/15",  text: "text-fuchsia-400" },
  ainews:                { bg: "bg-sky-500/15",       text: "text-sky-400" },
  artificialintelligence:{ bg: "bg-blue-500/15",     text: "text-blue-400" },
  // Local LLMs
  localllama:            { bg: "bg-lime-500/15",     text: "text-lime-400" },
  ollama:                { bg: "bg-green-500/15",    text: "text-green-400" },
  oobabooga:             { bg: "bg-emerald-600/15",  text: "text-emerald-400" },
  // Coding & tools
  vibecoding:            { bg: "bg-yellow-400/15",   text: "text-yellow-300" },
  claudeai:              { bg: "bg-amber-400/15",    text: "text-amber-300" },
  claudecode:            { bg: "bg-orange-400/15",   text: "text-orange-300" },
  chatgpt:               { bg: "bg-teal-500/15",     text: "text-teal-400" },
  openai:                { bg: "bg-emerald-400/15",  text: "text-emerald-300" },
  aiassistants:          { bg: "bg-blue-400/15",     text: "text-blue-300" },
  cursorai:              { bg: "bg-purple-400/15",   text: "text-purple-300" },
  // Models
  bard:                  { bg: "bg-blue-300/15",     text: "text-blue-300" },
  gemini:                { bg: "bg-indigo-400/15",   text: "text-indigo-300" },
  grok:                  { bg: "bg-red-400/15",      text: "text-red-300" },
  kling_ai:              { bg: "bg-pink-400/15",     text: "text-pink-300" },
  midjourney:            { bg: "bg-rose-600/15",     text: "text-rose-400" },
  stablediffusion:       { bg: "bg-pink-500/15",     text: "text-pink-400" },
  mediasynthesis:        { bg: "bg-purple-500/15",   text: "text-purple-400" },
  // Chinese AI
  deepseek:              { bg: "bg-cyan-600/15",     text: "text-cyan-400" },
  chineseai:             { bg: "bg-red-500/15",      text: "text-red-400" },
  // Benchmarks
  languagemodelsevals:   { bg: "bg-slate-400/15",    text: "text-slate-300" },
};

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
  };
}

async function fetchSubreddit(
  subreddit: string,
  sort: RedditSort,
  limit = 15
): Promise<NewsItem[]> {
  const tParam = sort === "top" ? "?t=week&limit=" + limit : `?limit=${limit}`;
  const url = `https://old.reddit.com/r/${subreddit}/${sort}.json${tParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PandaApps-NewsBot/1.0 (https://pandaapps.com)",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[reddit] r/${subreddit}/${sort} responded ${res.status}`);
      return [];
    }

    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    return posts
      .filter((p) => p.data.score >= 1)
      .map((p) => {
        const post = p.data;
        const postUrl = post.is_self
          ? `https://www.reddit.com${post.permalink}`
          : post.url;

        const excerpt =
          post.is_self && post.selftext && post.selftext.length > 10
            ? post.selftext.slice(0, 220).replace(/\s+/g, " ").trim() + "…"
            : `${post.score.toLocaleString()} upvotes · ${post.num_comments.toLocaleString()} comments`;

        return {
          id: `reddit-${post.id}`,
          title: post.title,
          url: postUrl,
          excerpt,
          source: `r/${post.subreddit}`,
          sourceId: `reddit-${post.subreddit.toLowerCase()}`,
          sourceType: "news" as const,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          score: post.score,
          commentCount: post.num_comments,
        } satisfies NewsItem;
      })
      .filter((item) => item.title && item.url && isAIContent(item.title, item.excerpt));
  } catch (err) {
    console.error(`[reddit] Failed to fetch r/${subreddit}:`, err);
    return [];
  }
}

export async function fetchRedditAI(sort: RedditSort): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    REDDIT_AI_SUBREDDITS.map((s) => fetchSubreddit(s, sort))
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort: hot/new → by date desc, top → by score desc
  if (sort === "top") {
    return deduped.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
