"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  X,
  ExternalLink,
  Newspaper,
  Mail,
  Globe,
  Clock,
  RefreshCw,
  Rss,
  Flame,
  TrendingUp,
  MessageSquare,
  ArrowUp,
  Loader2,
  Star,
  Zap,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { NewsItem, NewsSource, SourceType, TrendPeriod, RedditSort } from "../types";
import { REDDIT_AI_SUBREDDITS, REDDIT_COLORS } from "../reddit-fetcher";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Source badge colours ──────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  venturebeat:        { bg: "bg-blue-500/15",   text: "text-blue-400" },
  techcrunch:         { bg: "bg-sky-500/15",     text: "text-sky-400" },
  theverge:           { bg: "bg-orange-500/15",  text: "text-orange-400" },
  wired:              { bg: "bg-zinc-500/15",    text: "text-zinc-400" },
  "mit-tech-review":  { bg: "bg-red-500/15",     text: "text-red-400" },
  openai:             { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  "google-ai":        { bg: "bg-blue-400/15",    text: "text-blue-300" },
  anthropic:          { bg: "bg-amber-500/15",   text: "text-amber-400" },
  "tldr-ai":          { bg: "bg-violet-500/15",  text: "text-violet-400" },
  "import-ai":        { bg: "bg-cyan-500/15",    text: "text-cyan-400" },
  "bens-bites":       { bg: "bg-yellow-500/15",  text: "text-yellow-400" },
  "innov8-l8r":       { bg: "bg-rose-500/15",    text: "text-rose-400" },
  "world-of-ai":      { bg: "bg-violet-500/15",  text: "text-violet-400" },
  "evolving-ai":      { bg: "bg-cyan-500/15",    text: "text-cyan-400" },
  "hacker-news":      { bg: "bg-orange-600/15",  text: "text-orange-500" },
  "reddit-artificial":    { bg: "bg-rose-500/15",    text: "text-rose-400" },
  "reddit-machinelearning": { bg: "bg-indigo-500/15", text: "text-indigo-400" },
  "reddit-localllama":    { bg: "bg-lime-500/15",    text: "text-lime-400" },
  "reddit-claudeai":      { bg: "bg-amber-400/15",   text: "text-amber-300" },
  "reddit-openai":        { bg: "bg-emerald-400/15", text: "text-emerald-300" },
  "reddit-singularity":   { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400" },
  "reddit-chatgpt":       { bg: "bg-teal-500/15",    text: "text-teal-400" },
  "reddit-bard":          { bg: "bg-blue-300/15",    text: "text-blue-300" },
};

const TYPE_ICON: Record<SourceType, React.ElementType> = {
  news: Globe,
  newsletter: Mail,
  blog: Rss,
};

const TYPE_LABEL: Record<SourceType, string> = {
  news: "News",
  newsletter: "Newsletter",
  blog: "Blog",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SourceBadge({ sourceId, sourceName }: { sourceId: string; sourceName: string }) {
  const c = SOURCE_COLORS[sourceId] ?? { bg: "bg-accent/15", text: "text-accent" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {sourceName}
    </span>
  );
}

function TypeBadge({ type }: { type: SourceType }) {
  const Icon = TYPE_ICON[type];
  const label = TYPE_LABEL[type];
  const styles: Record<SourceType, string> = {
    news: "text-blue-400/70",
    newsletter: "text-violet-400/70",
    blog: "text-emerald-400/70",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${styles[type]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/30 p-5 hover:border-accent/30 hover:bg-card/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge sourceId={item.sourceId} sourceName={item.source} />
          <TypeBadge type={item.sourceType} />
        </div>
        <span className="flex items-center gap-1 text-xs text-muted shrink-0">
          <Clock className="h-3 w-3" />
          {relativeTime(item.publishedAt)}
        </span>
      </div>

      <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-3">
        {item.title}
      </h3>

      {item.excerpt && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3">{item.excerpt}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-1">
        <ExternalLink className="h-3 w-3" />
        Read article
      </div>
    </a>
  );
}

// ── Trending row card ─────────────────────────────────────────────────────────

function TrendingCard({ item, rank }: { item: NewsItem; rank: number }) {
  const rankColors = ["text-amber-400", "text-zinc-300", "text-orange-600"];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : "text-muted/50";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl border border-border/30 bg-card/20 px-4 py-3.5 hover:border-accent/25 hover:bg-card/50 transition-all duration-150"
    >
      {/* Rank */}
      <span className={`shrink-0 w-5 text-center text-sm font-bold tabular-nums ${rankColor}`}>
        {rank}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <SourceBadge sourceId={item.sourceId} sourceName={item.source} />
          <span className="text-xs text-muted">{relativeTime(item.publishedAt)}</span>
        </div>
        <p className="text-sm font-medium leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
          {item.title}
        </p>
      </div>

      {/* Engagement */}
      <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-muted">
        {item.score != null && (
          <span className="flex items-center gap-0.5">
            <ArrowUp className="h-3 w-3 text-accent/60" />
            {fmt(item.score)}
          </span>
        )}
        {item.commentCount != null && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" />
            {fmt(item.commentCount)}
          </span>
        )}
      </div>
    </a>
  );
}

// ── Trending section ──────────────────────────────────────────────────────────

const TREND_TABS: { id: TrendPeriod; label: string }[] = [
  { id: "day",   label: "Today" },
  { id: "week",  label: "This Week" },
  { id: "month", label: "This Month" },
];

function TrendingSection() {
  const [period, setPeriod]   = useState<TrendPeriod>("day");
  const [items, setItems]     = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cache, setCache]     = useState<Partial<Record<TrendPeriod, NewsItem[]>>>({});

  useEffect(() => {
    if (cache[period]) {
      setItems(cache[period]!);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/ai-news/trending?period=${period}`)
      .then((r) => r.json())
      .then((data: { items: NewsItem[] }) => {
        setItems(data.items ?? []);
        setCache((prev) => ({ ...prev, [period]: data.items ?? [] }));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <section className="mt-14">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold">Top AI News</h2>
          <span className="text-xs text-muted/60 ml-1">ranked by community engagement</span>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 rounded-full border border-border/40 bg-card/30 p-1">
          {TREND_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                period === id
                  ? "bg-accent text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">No trending data available right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.slice(0, 10).map((item, i) => (
            <TrendingCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted/50 mt-4 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" />
        Ranked by upvotes from Reddit AI communities (r/artificial, r/MachineLearning, r/LocalLLaMA, r/ClaudeAI, r/OpenAI…). Updated hourly.
      </p>
    </section>
  );
}

// ── Reddit section ────────────────────────────────────────────────────────────

const SORT_TABS: { id: RedditSort; label: string; icon: React.ElementType }[] = [
  { id: "hot",  label: "Hot",  icon: Flame },
  { id: "new",  label: "New",  icon: Zap },
  { id: "top",  label: "Top",  icon: TrendingUp },
];

function RedditSection() {
  const [sort, setSort]           = useState<RedditSort>("hot");
  const [subreddit, setSubreddit] = useState<string | null>(null);
  const [items, setItems]         = useState<NewsItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cache, setCache]         = useState<Partial<Record<RedditSort, NewsItem[]>>>({});
  const [query, setQuery]         = useState("");

  useEffect(() => {
    if (cache[sort]) {
      setItems(cache[sort]!);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/ai-news/reddit?sort=${sort}`)
      .then((r) => r.json())
      .then((data: { items: NewsItem[] }) => {
        setItems(data.items ?? []);
        setCache((prev) => ({ ...prev, [sort]: data.items ?? [] }));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [sort]);

  const filtered = useMemo(() => {
    let result = subreddit
      ? items.filter((i) => i.sourceId === `reddit-${subreddit.toLowerCase()}`)
      : items;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (i) => i.title.toLowerCase().includes(q) || i.excerpt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, subreddit, query]);

  // subreddits present in current result set
  const activeSubreddits = useMemo(() => {
    const ids = new Set(items.map((i) => i.sourceId.replace("reddit-", "")));
    return REDDIT_AI_SUBREDDITS.filter((s) => ids.has(s.toLowerCase()));
  }, [items]);

  return (
    <div>
      {/* Sort + search row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 rounded-full border border-border/40 bg-card/30 p-1">
          {SORT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setSort(id); setSubreddit(null); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                sort === id
                  ? "bg-orange-500 text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Reddit posts…"
            className="w-full rounded-full border border-border/50 bg-card/40 pl-9 pr-8 py-2 text-xs text-foreground placeholder-muted focus:outline-none focus:border-accent/40 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Subreddit chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setSubreddit(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            subreddit === null
              ? "bg-foreground/10 text-foreground border border-border/70"
              : "text-muted hover:text-foreground"
          }`}
        >
          All subreddits
        </button>
        {activeSubreddits.map((s) => {
          const c = REDDIT_COLORS[s.toLowerCase()] ?? { bg: "bg-accent/15", text: "text-accent" };
          const active = subreddit === s;
          return (
            <button
              key={s}
              onClick={() => setSubreddit(active ? null : s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                active
                  ? `${c.bg} ${c.text} border-current/30`
                  : "text-muted border-transparent hover:text-foreground"
              }`}
            >
              r/{s}
            </button>
          );
        })}
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🐼</div>
          <p className="text-sm text-muted">No posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/30 p-5 hover:border-orange-400/30 hover:bg-card/60 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                {(() => {
                  const key = item.sourceId.replace("reddit-", "");
                  const c = REDDIT_COLORS[key] ?? { bg: "bg-orange-500/15", text: "text-orange-400" };
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
                      {item.source}
                    </span>
                  );
                })()}
                <span className="flex items-center gap-1 text-xs text-muted shrink-0">
                  <Clock className="h-3 w-3" />
                  {relativeTime(item.publishedAt)}
                </span>
              </div>

              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-orange-400 transition-colors line-clamp-3">
                {item.title}
              </h3>

              {item.excerpt && (
                <p className="text-xs text-muted leading-relaxed line-clamp-2">{item.excerpt}</p>
              )}

              <div className="flex items-center gap-3 mt-auto pt-1">
                {item.score != null && (
                  <span className="flex items-center gap-0.5 text-xs text-muted">
                    <ArrowUp className="h-3 w-3 text-orange-400/70" />
                    {fmt(item.score)}
                  </span>
                )}
                {item.commentCount != null && (
                  <span className="flex items-center gap-0.5 text-xs text-muted">
                    <MessageSquare className="h-3 w-3" />
                    {fmt(item.commentCount)}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1 text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3 w-3" />
                  Open
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-muted/50 mt-6 flex items-center gap-1.5">
        <Users className="h-3 w-3" />
        {filtered.length} AI posts from {activeSubreddits.length} subreddits · updated hourly
      </p>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = "all" | SourceType | "reddit";

const TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: "all",        label: "All",         icon: Newspaper },
  { id: "news",       label: "News",        icon: Globe },
  { id: "newsletter", label: "Newsletters", icon: Mail },
  { id: "blog",       label: "Blogs",       icon: Rss },
  { id: "reddit",     label: "Reddit",      icon: Flame },
];

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  items: NewsItem[];
  sources: NewsSource[];
  fetchedAt: string;
}

export default function AINewsClient({ items, sources, fetchedAt }: Props) {
  const [tab, setTab]           = useState<FilterTab>("all");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [query, setQuery]       = useState("");

  const isRedditTab = tab === "reddit";

  const activeSources = useMemo(() => {
    const ids = new Set(items.map((i) => i.sourceId));
    // Priority sources come first
    return sources
      .filter((s) => ids.has(s.id))
      .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  }, [items, sources]);

  const hnPresent = useMemo(() => items.some((i) => i.sourceId === "hacker-news"), [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (tab !== "all" && tab !== "reddit") result = result.filter((i) => i.sourceType === tab);
    if (sourceId) result = result.filter((i) => i.sourceId === sourceId);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.excerpt.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, tab, sourceId, query]);

  const handleTabChange = (t: FilterTab) => {
    setTab(t);
    setSourceId(null);
  };

  const counts = useMemo(
    () => ({
      all:        items.length,
      news:       items.filter((i) => i.sourceType === "news").length,
      newsletter: items.filter((i) => i.sourceType === "newsletter").length,
      blog:       items.filter((i) => i.sourceType === "blog").length,
      reddit:     null, // loaded on-demand
    }),
    [items]
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-7xl">

        {/* ── Top nav ── */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All Apps
          </Link>
          <ThemeToggle />
        </div>

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-medium text-accent mb-4">
            <Newspaper className="h-3 w-3" />
            AI News Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Daily AI News & Newsletters
          </h1>
          <p className="text-muted max-w-2xl text-base leading-relaxed">
            Curated from L8R by innov8, World of AI, Evolving AI Insights, plus VentureBeat,
            TechCrunch, The Verge, TLDR AI, and more — refreshed every 24 hours.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted/60 mt-3">
            <RefreshCw className="h-3 w-3" />
            Last fetched {relativeTime(fetchedAt)} · {items.length} articles
          </p>
        </div>

        {/* ── Divider (hidden on Reddit tab) ── */}
        {!isRedditTab && <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-xs text-muted/60 font-medium uppercase tracking-widest">Latest Feed</span>
          <div className="h-px flex-1 bg-border/30" />
        </div>}

        {/* ── Search (hidden on Reddit tab) ── */}
        {!isRedditTab && <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines, sources…"
            className="w-full rounded-full border border-border/50 bg-card/40 pl-11 pr-10 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/40 focus:bg-card/60 transition-all backdrop-blur-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>}

        {/* ── Type tabs ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === id
                  ? id === "reddit"
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "bg-accent text-black shadow-sm shadow-accent/20"
                  : "bg-card/40 border border-border/40 text-muted hover:text-foreground hover:border-border/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {counts[id] !== null && (
                <span className={`text-xs ${tab === id ? "text-black/70" : "text-muted/70"}`}>
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Reddit section ── */}
        {isRedditTab && <RedditSection />}

        {/* ── Source chips (hidden on Reddit tab) ── */}
        {!isRedditTab && <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSourceId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              sourceId === null
                ? "bg-foreground/10 text-foreground border border-border/70"
                : "text-muted hover:text-foreground"
            }`}
          >
            All sources
          </button>
          {activeSources
            .filter((s) => tab === "all" || s.type === tab)
            .map((s) => {
              const c = SOURCE_COLORS[s.id] ?? { bg: "bg-accent/15", text: "text-accent" };
              const active = sourceId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSourceId(active ? null : s.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                    active
                      ? `${c.bg} ${c.text} border-current/30`
                      : "text-muted border-transparent hover:text-foreground"
                  }`}
                >
                  {s.priority && <Star className="h-3 w-3 fill-current" />}
                  {s.name}
                </button>
              );
            })}
          {hnPresent && (tab === "all" || tab === "news") && (
            <button
              onClick={() => setSourceId(sourceId === "hacker-news" ? null : "hacker-news")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                sourceId === "hacker-news"
                  ? "bg-orange-500/15 text-orange-400 border-current/30"
                  : "text-muted border-transparent hover:text-foreground"
              }`}
            >
              Hacker News
            </button>
          )}
        </div>}

        {/* ── Article grid (hidden on Reddit tab) ── */}
        {!isRedditTab && (filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🐼</div>
            <p className="text-foreground font-medium mb-1">No articles found</p>
            <p className="text-sm text-muted">
              Try a different keyword or{" "}
              <button
                onClick={() => { setQuery(""); setTab("all"); setSourceId(null); }}
                className="text-accent hover:underline"
              >
                clear filters
              </button>
            </p>
          </div>
        ))}

        {/* ── Trending section ── */}
        <div className="flex items-center gap-4 mt-14 mb-8">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-xs text-muted/60 font-medium uppercase tracking-widest">Trending Now</span>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <TrendingSection />

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-muted/50 mt-14">
          Articles link directly to their original sources. Panda Apps does not store or reproduce content.
        </p>
      </div>
    </div>
  );
}
