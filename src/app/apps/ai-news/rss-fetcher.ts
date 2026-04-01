import { SOURCES } from "./sources";
import type { NewsItem, NewsSource } from "./types";

// ── Minimal RSS/Atom XML parser ───────────────────────────────────────────────

function extractCdata(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function extractText(xml: string, tag: string): string {
  const cdata = extractCdata(xml, tag);
  if (cdata) return cdata;
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}

function extractLink(xml: string): string {
  // Atom: <link href="..." />  or  <link href="..." rel="alternate" />
  const atom = xml.match(/<link[^>]+href="([^"]*)"[^>]*\/?>/i);
  if (atom) return atom[1];
  // RSS 2: <link>url</link>
  const rss = xml.match(/<link>([\s\S]*?)<\/link>/i);
  if (rss) return rss[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toExcerpt(raw: string, maxLen = 220): string {
  const clean = stripHtml(raw);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  try {
    return new Date(raw).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ── Per-source fetcher ────────────────────────────────────────────────────────

async function fetchRSSSource(source: NewsSource): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.rssUrl, {
      headers: {
        "User-Agent": "PandaApps-NewsBot/1.0 (https://pandaapps.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();

    // Match both <item> (RSS) and <entry> (Atom)
    const itemRe = /<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/gi;
    const items = xml.match(itemRe) ?? [];

    return items
      .slice(0, 12)
      .map((item, i) => {
        const title = extractText(item, "title");
        const url = extractLink(item);
        const pubDate =
          extractText(item, "pubDate") ||
          extractText(item, "published") ||
          extractText(item, "updated") ||
          extractText(item, "dc:date");
        const rawDesc =
          extractCdata(item, "content:encoded") ||
          extractText(item, "content:encoded") ||
          extractCdata(item, "description") ||
          extractText(item, "description") ||
          extractText(item, "summary") ||
          extractText(item, "content");

        const excerpt = toExcerpt(rawDesc);

        return {
          id: `${source.id}-${i}-${Date.now()}`,
          title,
          url,
          excerpt,
          source: source.name,
          sourceId: source.id,
          sourceType: source.type,
          publishedAt: parseDate(pubDate),
        } satisfies NewsItem;
      })
      .filter((item) => item.title && item.url);
  } catch {
    // Silently skip failing sources
    return [];
  }
}

// ── Hacker News (JSON, no auth) ───────────────────────────────────────────────

async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?query=AI+LLM+machine+learning&tags=story&hitsPerPage=12",
      {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];

    const data: {
      hits: Array<{
        objectID: string;
        title: string;
        url?: string;
        points: number;
        num_comments: number;
        created_at: string;
      }>;
    } = await res.json();

    return (data.hits ?? [])
      .filter((h) => h.url && h.title)
      .map((h, i) => ({
        id: `hn-${h.objectID ?? i}`,
        title: h.title,
        url: h.url!,
        excerpt: `${h.points} points · ${h.num_comments} comments on Hacker News`,
        source: "Hacker News",
        sourceId: "hacker-news",
        sourceType: "news" as const,
        publishedAt: parseDate(h.created_at),
      }));
  } catch {
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchAllNews(): Promise<NewsItem[]> {
  const [hnItems, ...rssResults] = await Promise.allSettled([
    fetchHackerNews(),
    ...SOURCES.map(fetchRSSSource),
  ]);

  const all: NewsItem[] = [];

  if (hnItems.status === "fulfilled") all.push(...hnItems.value);
  for (const r of rssResults) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by URL, then sort newest-first
  const seen = new Set<string>();
  return all
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}
