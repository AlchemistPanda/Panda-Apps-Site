import { isAIContent } from "./ai-filter";
import { SOURCES } from "./sources";
import type { NewsItem, NewsSource, SourceType } from "./types";

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

// ── Generic Beehiiv page scraper ─────────────────────────────────────────────
// Beehiiv blocks RSS/feed endpoints with Cloudflare bot protection.
// However, Beehiiv sites are Remix SSR apps that embed all post metadata
// as JSON in the homepage HTML. We fetch with browser headers and extract:
//   web_title, web_subtitle, override_scheduled_at, slug, image_url

function decodeBeehiivJson(s: string): string {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/\\"/g, '"')
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .trim();
}

async function fetchBeehiivSite(
  baseUrl: string,
  sourceName: string,
  sourceId: string,
  sourceType: SourceType = "newsletter"
): Promise<NewsItem[]> {
  try {
    const res = await fetch(baseUrl, {
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

    // Anchor pattern: these two fields always appear adjacent in every Beehiiv SSR page
    const anchorRe = /"override_scheduled_at":"([^"]+)","slug":"([^"]+)"/g;
    const items: NewsItem[] = [];
    const seenSlugs = new Set<string>();
    let m: RegExpExecArray | null;

    while ((m = anchorRe.exec(html)) !== null) {
      const [full, date, slug] = m;
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      // Look up to 1000 chars back for web_title and web_subtitle.
      // Take the LAST match (closest to the anchor = this post's data).
      const lookback = html.slice(Math.max(0, m.index - 1000), m.index);

      const titleMatches = [...lookback.matchAll(/"web_title":"((?:[^"\\]|\\.)*)"/g)];
      if (titleMatches.length === 0) continue;
      const rawTitle = titleMatches[titleMatches.length - 1][1];

      const subMatches = [...lookback.matchAll(/"web_subtitle":"((?:[^"\\]|\\.)*)"/g)];
      const rawSub = subMatches.length > 0 ? subMatches[subMatches.length - 1][1] : "";

      // Look up to 500 chars ahead for image_url (comes after slug in the JSON)
      const ahead = html.slice(m.index + full.length, m.index + full.length + 500);
      const imgMatch = ahead.match(/"image_url":"(https?:\/\/[^"]+)"/);
      const imageUrl = imgMatch?.[1];

      const title   = decodeBeehiivJson(rawTitle);
      const excerpt = decodeBeehiivJson(rawSub);
      const url     = `${baseUrl.replace(/\/$/, "")}/p/${slug}`;

      if (!title) continue;

      items.push({
        id: `${sourceId}-${slug}`,
        title,
        url,
        excerpt,
        imageUrl,
        source: sourceName,
        sourceId,
        sourceType,
        publishedAt: new Date(date).toISOString(),
      });
    }

    return items.filter((item) => isAIContent(item.title, item.excerpt));
  } catch {
    return [];
  }
}

// ── L8R by Innov8 — sitemap-based fetcher ────────────────────────────────────
// letter.innov8academy.in has strict Cloudflare Bot Protection on the homepage,
// which blocks data-center IPs (Vercel). The sitemap at /sitemap.xml is
// Cloudflare-whitelisted (needed for Googlebot) and returns clean XML with
// all post URLs, lastmod dates, and titles for the most recent posts.

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

async function fetchInnov8L8R(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://letter.innov8academy.in/sitemap.xml", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/xml, text/xml, */*",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const xml = await res.text();

    // Parse each <url> block
    const urlBlocks = xml.match(/<url[\s>][\s\S]*?<\/url>/gi) ?? [];
    const items: NewsItem[] = [];

    for (const block of urlBlocks) {
      const locMatch = block.match(/<loc>(https?:\/\/[^<]+)<\/loc>/);
      if (!locMatch) continue;
      const url = locMatch[1].trim();

      // Only post pages
      if (!url.includes("/p/")) continue;
      const slug = url.split("/p/").pop() ?? "";
      if (!slug) continue;

      const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);

      // Prefer <news:title> + <news:publication_date> (present on recent posts)
      const newsTitleMatch  = block.match(/<news:title>([^<]+)<\/news:title>/);
      const newsDateMatch   = block.match(/<news:publication_date>([^<]+)<\/news:publication_date>/);

      let title: string;
      let publishedAt: string;

      if (newsTitleMatch) {
        title       = decodeXmlEntities(newsTitleMatch[1]);
        publishedAt = newsDateMatch
          ? new Date(newsDateMatch[1]).toISOString()
          : new Date((lastmodMatch?.[1] ?? "") + "T00:00:00Z").toISOString();
      } else {
        // Derive a readable title from the slug for older posts
        title = slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        publishedAt = lastmodMatch
          ? new Date(lastmodMatch[1] + "T00:00:00Z").toISOString()
          : new Date().toISOString();
      }

      if (!title || !isAIContent(title, "")) continue;

      items.push({
        id: `innov8-l8r-${slug}`,
        title,
        url,
        excerpt: "",
        source: "L8R by Innov8",
        sourceId: "innov8-l8r",
        sourceType: "newsletter" as const,
        publishedAt,
      });
    }

    return items
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 12);
  } catch {
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

// Sources fetched via dedicated scrapers/APIs — excluded from generic RSS loop
const CUSTOM_SOURCE_IDS = new Set([
  "techcrunch",        // WordPress REST API
  "innov8-l8r",        // Beehiiv sitemap
  "evolving-ai",       // Beehiiv page scraper
  "world-of-ai",       // Beehiiv page scraper
  "in-world-of-ai",    // Beehiiv page scraper
  "deep-view",         // Beehiiv page scraper
  "tech-newsletter",   // Beehiiv page scraper
]);

// Beehiiv newsletters fetched via homepage scraper (L8R uses sitemap instead)
const BEEHIIV_SOURCES: [string, string, string, SourceType][] = [
  ["https://evolvingai.io/",                    "Evolving AI Insights", "evolving-ai",    "newsletter"],
  ["https://worldofai.beehiiv.com/",            "World of AI",          "world-of-ai",    "newsletter"],
  ["https://intheworldofai.com/",               "In the World of AI",   "in-world-of-ai", "newsletter"],
  ["https://archive.thedeepview.com/",          "The Deep View",        "deep-view",      "newsletter"],
  ["https://technology-newsletter.beehiiv.com/","Technology News",      "tech-newsletter","newsletter"],
];

export async function fetchAllNews(): Promise<NewsItem[]> {
  // Priority and regular RSS sources (Beehiiv + TechCrunch handled separately)
  const prioritySources = SOURCES.filter((s) => s.priority && !CUSTOM_SOURCE_IDS.has(s.id));
  const regularSources  = SOURCES.filter((s) => !s.priority && !CUSTOM_SOURCE_IDS.has(s.id));

  const [hnResult, tcResult, l8rResult, ...rest] = await Promise.allSettled([
    fetchHackerNews(),
    fetchTechCrunchWP(),
    fetchInnov8L8R(),                                          // sitemap-based
    ...BEEHIIV_SOURCES.map((args) => fetchBeehiivSite(...args)), // page scrapers
    ...prioritySources.map(fetchRSSSource),
    ...regularSources.map(fetchRSSSource),
  ]);

  const priorityItems: NewsItem[] = [];
  const regularItems:  NewsItem[] = [];

  // L8R is priority
  if (l8rResult.status === "fulfilled") priorityItems.push(...l8rResult.value);

  // First N results in `rest` are Beehiiv page-scraped newsletters
  const beehiivResults = rest.slice(0, BEEHIIV_SOURCES.length);
  const rssResults     = rest.slice(BEEHIIV_SOURCES.length);

  // evolving-ai and world-of-ai are priority newsletters
  const priorityBeehiivIds = new Set(["evolving-ai", "world-of-ai"]);
  for (let i = 0; i < BEEHIIV_SOURCES.length; i++) {
    if (beehiivResults[i].status !== "fulfilled") continue;
    const [, , id] = BEEHIIV_SOURCES[i];
    if (priorityBeehiivIds.has(id)) {
      priorityItems.push(...(beehiivResults[i] as PromiseFulfilledResult<NewsItem[]>).value);
    } else {
      regularItems.push(...(beehiivResults[i] as PromiseFulfilledResult<NewsItem[]>).value);
    }
  }

  // Priority RSS sources
  for (let i = 0; i < prioritySources.length; i++) {
    const r = rssResults[i];
    if (r.status === "fulfilled") priorityItems.push(...r.value);
  }

  // Regular items: HN, TechCrunch, regular RSS
  if (hnResult.status === "fulfilled") regularItems.push(...hnResult.value);
  if (tcResult.status === "fulfilled") regularItems.push(...tcResult.value);
  for (let i = prioritySources.length; i < rssResults.length; i++) {
    const r = rssResults[i];
    if (r.status === "fulfilled") regularItems.push(...r.value);
  }

  const merged = [...priorityItems, ...regularItems];
  return deduplicateItems(merged).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
