import { isAIContent } from "./ai-filter";
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

/** Try to extract an image URL from an RSS/Atom item block. */
function extractImageUrl(itemXml: string, rawDesc: string): string | undefined {
  // 1. <media:content url="..."> or <media:thumbnail url="...">
  const media = itemXml.match(/<media:(?:content|thumbnail)[^>]+url="([^"]+)"/i);
  if (media?.[1]) return media[1];

  // 2. <enclosure url="..." type="image/...">
  const enclosure = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image\/[^"]+"/i);
  if (enclosure?.[1]) return enclosure[1];
  // Also match when type comes before url
  const enclosure2 = itemXml.match(/<enclosure[^>]+type="image\/[^"]+"[^>]+url="([^"]+)"/i);
  if (enclosure2?.[1]) return enclosure2[1];

  // 3. First <img src="..."> in description/content HTML
  const img = rawDesc.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);
  if (img?.[1]) return img[1].replace(/&#0*38;/g, "&").replace(/&amp;/g, "&");

  return undefined;
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
        // Keep the raw HTML around for image extraction before stripping.
        // Also check bare <content> (Atom feeds like The Verge).
        const rawDescHtml =
          extractCdata(item, "content:encoded") ||
          extractCdata(item, "content") ||
          extractCdata(item, "description") ||
          "";
        const rawDesc =
          rawDescHtml ||
          extractText(item, "content:encoded") ||
          extractText(item, "description") ||
          extractText(item, "summary") ||
          extractText(item, "content");

        const excerpt = toExcerpt(rawDesc);
        const imageUrl = extractImageUrl(item, rawDescHtml || rawDesc);

        return {
          id: `${source.id}-${i}-${Date.now()}`,
          title,
          url,
          excerpt,
          imageUrl,
          source: source.name,
          sourceId: source.id,
          sourceType: source.type,
          publishedAt: parseDate(pubDate),
        } satisfies NewsItem;
      })
      .filter((item) => item.title && item.url && isAIContent(item.title, item.excerpt));
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

// ── Deduplication helpers ─────────────────────────────────────────────────────

/** Strip protocol, www, trailing slashes, query params for comparison. */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return (u.hostname.replace(/^www\./, "") + u.pathname)
      .replace(/\/+$/, "")
      .toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Rough title fingerprint: lowercase, strip punctuation + stopwords,
 * sort remaining words. Two articles with the same fingerprint are
 * almost certainly the same story.
 */
function titleFingerprint(title: string): string {
  const stops = new Set([
    "a","an","the","and","or","but","in","on","at","to","for","of",
    "with","by","from","is","are","was","were","be","been","has","have",
    "had","do","does","did","will","can","could","should","may","might",
  ]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stops.has(w))
    .sort()
    .join(" ");
}

/**
 * Deduplicate items by normalized URL **and** title fingerprint.
 * Priority sources win when there is a collision (they appear first
 * in the input list).
 */
function deduplicateItems(items: NewsItem[]): NewsItem[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  return items.filter((item) => {
    const nUrl = normalizeUrl(item.url);
    const nTitle = titleFingerprint(item.title);

    if (seenUrls.has(nUrl)) return false;
    if (nTitle.length > 10 && seenTitles.has(nTitle)) return false;

    seenUrls.add(nUrl);
    if (nTitle.length > 10) seenTitles.add(nTitle);
    return true;
  });
}

// ── TechCrunch via WordPress REST API (RSS has no images) ─────────────────────

async function fetchTechCrunchWP(): Promise<NewsItem[]> {
  // Category 577047203 = "AI" on techcrunch.com
  const url =
    "https://techcrunch.com/wp-json/wp/v2/posts" +
    "?categories=577047203&per_page=12" +
    "&_fields=link,date,title,excerpt,jetpack_featured_media_url";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PandaApps-NewsBot/1.0 (https://pandaapps.com)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const posts: Array<{
      link: string;
      date: string;
      title: { rendered: string };
      excerpt: { rendered: string };
      jetpack_featured_media_url?: string;
    }> = await res.json();

    return posts
      .map((p, i) => {
        const title = p.title.rendered
          .replace(/&#8217;/g, "'")
          .replace(/&#8220;/g, '"')
          .replace(/&#8221;/g, '"')
          .replace(/&#8230;/g, "…")
          .replace(/&amp;/g, "&")
          .replace(/<[^>]+>/g, "")
          .trim();

        const excerpt = toExcerpt(p.excerpt.rendered);
        const imageUrl = p.jetpack_featured_media_url || undefined;

        return {
          id: `techcrunch-wp-${i}-${Date.now()}`,
          title,
          url: p.link,
          excerpt,
          imageUrl,
          source: "TechCrunch",
          sourceId: "techcrunch",
          sourceType: "news" as const,
          publishedAt: new Date(p.date + "Z").toISOString(),
        } satisfies NewsItem;
      })
      .filter((item) => item.title && item.url && isAIContent(item.title, item.excerpt));
  } catch {
    return [];
  }
}

// ── L8R by Innov8 via Beehiiv page scrape ────────────────────────────────────
// The old Substack feed (innov8ai.substack.com) stopped publishing in Oct 2024.
// The newsletter moved to https://letter.innov8academy.in/ (Beehiiv-powered).
// Beehiiv blocks bot UA on RSS endpoints, but the homepage SSR HTML embeds
// all post metadata as JSON — we extract it directly from there.

async function fetchInnov8L8R(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://letter.innov8academy.in/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const html = await res.text();

    // The Remix SSR embeds post data as JSON. Each post has these fields
    // adjacent in the serialized output:
    //   "web_title":"…","web_subtitle":"…","featured":…,"hide_from_feed":…,
    //   "comments_state":"…","override_scheduled_at":"…","slug":"…"
    const postRe =
      /"web_title":"((?:[^"\\]|\\.)*)","web_subtitle":"((?:[^"\\]|\\.)*)"(?:,"[^"]+":"[^"]*")*?,"override_scheduled_at":"([^"]+)","slug":"([^"]+)"/g;

    function decodeJson(s: string): string {
      return s
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16))
        )
        .replace(/\\"/g, '"')
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .trim();
    }

    const items: NewsItem[] = [];
    const seenSlugs = new Set<string>();
    let m: RegExpExecArray | null;

    while ((m = postRe.exec(html)) !== null) {
      const [, rawTitle, rawSub, date, slug] = m;
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const title = decodeJson(rawTitle);
      const excerpt = decodeJson(rawSub);
      const url = `https://letter.innov8academy.in/p/${slug}`;

      if (!title || !url) continue;

      items.push({
        id: `innov8-l8r-${slug}`,
        title,
        url,
        excerpt,
        source: "L8R by Innov8",
        sourceId: "innov8-l8r",
        sourceType: "newsletter" as const,
        publishedAt: new Date(date).toISOString(),
      });
    }

    return items;
  } catch {
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

// Sources handled by dedicated fetchers (skipped from generic RSS fetching)
const CUSTOM_SOURCE_IDS = new Set(["techcrunch", "innov8-l8r"]);

export async function fetchAllNews(): Promise<NewsItem[]> {
  // Fetch priority sources first so they win in deduplication.
  // innov8-l8r and techcrunch use dedicated fetchers — exclude from RSS.
  const prioritySources = SOURCES.filter((s) => s.priority && !CUSTOM_SOURCE_IDS.has(s.id));
  const regularSources = SOURCES.filter((s) => !s.priority && !CUSTOM_SOURCE_IDS.has(s.id));

  const [hnItems, tcItems, l8rItems, ...allRss] = await Promise.allSettled([
    fetchHackerNews(),
    fetchTechCrunchWP(),
    fetchInnov8L8R(),
    ...prioritySources.map(fetchRSSSource),
    ...regularSources.map(fetchRSSSource),
  ]);

  // Build combined list: priority items first, then HN + TC, then regular.
  // l8r is a priority newsletter — prepend it so it wins deduplication.
  const priorityItems: NewsItem[] = [];
  const regularItems: NewsItem[] = [];

  if (l8rItems.status === "fulfilled") priorityItems.push(...l8rItems.value);

  // Priority RSS sources come after the three specials in allRss
  for (let i = 0; i < prioritySources.length; i++) {
    const r = allRss[i];
    if (r.status === "fulfilled") priorityItems.push(...r.value);
  }

  if (hnItems.status === "fulfilled") regularItems.push(...hnItems.value);
  if (tcItems.status === "fulfilled") regularItems.push(...tcItems.value);

  for (let i = prioritySources.length; i < allRss.length; i++) {
    const r = allRss[i];
    if (r.status === "fulfilled") regularItems.push(...r.value);
  }

  // Merge: priority first so they survive deduplication
  const merged = [...priorityItems, ...regularItems];

  return deduplicateItems(merged).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
