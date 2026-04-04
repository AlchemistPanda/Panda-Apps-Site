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

// ── Minimal RSS helpers ───────────────────────────────────────────────────────

function extractCdata(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    "i"
  );
  return xml.match(re)?.[1].trim() ?? "";
}

function extractText(xml: string, tag: string): string {
  const cdata = extractCdata(xml, tag);
  if (cdata) return cdata;
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  return xml.match(re)?.[1].replace(/<[^>]+>/g, "").trim() ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Per-subreddit RSS fetch ───────────────────────────────────────────────────

async function fetchSubredditRSS(
  subreddit: string,
  sort: RedditSort
): Promise<NewsItem[]> {
  // Reddit exposes public RSS feeds — no API key needed
  const tParam = sort === "top" ? "?t=week&limit=25" : "?limit=25";
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.rss${tParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Reddit requires a descriptive User-Agent for RSS too
        "User-Agent": "PandaApps-NewsBot/1.0 (news aggregator; contact pandaapps.com)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[reddit-rss] r/${subreddit}/${sort} → ${res.status}`);
      return [];
    }

    const xml = await res.text();

    // Split into <entry> (Atom) or <item> (RSS 2) blocks
    const entryRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    const itemRe  = /<item[\s>]([\s\S]*?)<\/item>/gi;
    const blocks  = [...xml.matchAll(entryRe), ...xml.matchAll(itemRe)].map((m) => m[0]);

    return blocks.flatMap((block): NewsItem[] => {
      const title = extractText(block, "title");
      if (!title) return [];

      // Prefer <link href="..."> (Atom), fall back to <link> text node
      const linkHref = block.match(/<link[^>]+href="([^"]+)"/i)?.[1];
      const linkText = extractCdata(block, "link") || extractText(block, "link");
      const rawUrl   = linkHref ?? linkText ?? "";

      // Reddit Atom entries have the Reddit permalink as the link; the actual
      // external URL is buried in the <content> HTML — extract it if present
      const contentHtml = extractCdata(block, "content") || extractText(block, "content");
      const externalUrl = contentHtml.match(/href="(https?:\/\/(?!www\.reddit\.com)[^"]+)"/)?.[1];
      const url = externalUrl ?? rawUrl;

      if (!url || !url.startsWith("http")) return [];

      const pubDate = extractText(block, "published") || extractText(block, "updated") || extractText(block, "pubDate");
      const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();

      // Build a short excerpt from the content/description HTML
      const descHtml = contentHtml || extractCdata(block, "description") || extractText(block, "description");
      const excerpt = stripHtml(descHtml).slice(0, 220).trim() + (descHtml.length > 220 ? "…" : "");

      if (!isAIContent(title, excerpt)) return [];

      return [{
        id: `reddit-${Buffer.from(rawUrl).toString("base64").slice(0, 16)}`,
        title,
        url,
        excerpt,
        source: `r/${subreddit}`,
        sourceId: `reddit-${subreddit.toLowerCase()}`,
        sourceType: "news" as const,
        publishedAt,
        score: undefined,
        commentCount: undefined,
      }];
    });
  } catch (err) {
    console.error(`[reddit-rss] Failed r/${subreddit}:`, err);
    return [];
  }
}

// ── Batched fetch to avoid hammering Reddit ───────────────────────────────────

async function batchFetch(
  subreddits: string[],
  sort: RedditSort,
  batchSize = 6,
  delayMs = 300
): Promise<NewsItem[]> {
  const all: NewsItem[] = [];

  for (let i = 0; i < subreddits.length; i += batchSize) {
    const batch = subreddits.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((s) => fetchSubredditRSS(s, sort)));
    for (const r of results) {
      if (r.status === "fulfilled") all.push(...r.value);
    }
    if (i + batchSize < subreddits.length) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return all;
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchRedditAI(sort: RedditSort): Promise<NewsItem[]> {
  const all = await batchFetch(REDDIT_AI_SUBREDDITS, sort);

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort: top → by score (no score from RSS so just keep order), hot/new → by date desc
  if (sort === "top") {
    return deduped; // already ordered by Reddit's top ranking in the feed
  }
  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
