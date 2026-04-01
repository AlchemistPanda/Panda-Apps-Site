"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { NewsItem, NewsSource, SourceType } from "../types";

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

// ── Source badge colours (Tailwind-safe subset) ───────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  venturebeat:   { bg: "bg-blue-500/15",   text: "text-blue-400" },
  techcrunch:    { bg: "bg-sky-500/15",     text: "text-sky-400" },
  theverge:      { bg: "bg-orange-500/15",  text: "text-orange-400" },
  wired:         { bg: "bg-zinc-500/15",    text: "text-zinc-400" },
  "mit-tech-review": { bg: "bg-red-500/15", text: "text-red-400" },
  openai:        { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  "google-ai":   { bg: "bg-blue-400/15",   text: "text-blue-300" },
  anthropic:     { bg: "bg-amber-500/15",   text: "text-amber-400" },
  "tldr-ai":     { bg: "bg-violet-500/15",  text: "text-violet-400" },
  "import-ai":   { bg: "bg-cyan-500/15",    text: "text-cyan-400" },
  "bens-bites":  { bg: "bg-yellow-500/15",  text: "text-yellow-400" },
  "hacker-news": { bg: "bg-orange-600/15",  text: "text-orange-500" },
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
      {/* Top row: source + type + time */}
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

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-3">
        {item.title}
      </h3>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3">{item.excerpt}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-1">
        <ExternalLink className="h-3 w-3" />
        Read article
      </div>
    </a>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = "all" | SourceType;

const TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: "all",        label: "All",         icon: Newspaper },
  { id: "news",       label: "News",        icon: Globe },
  { id: "newsletter", label: "Newsletters", icon: Mail },
  { id: "blog",       label: "Blogs",       icon: Rss },
];

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  items: NewsItem[];
  sources: NewsSource[];
  fetchedAt: string;
}

export default function AINewsClient({ items, sources, fetchedAt }: Props) {
  const [tab, setTab]       = useState<FilterTab>("all");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [query, setQuery]   = useState("");

  // All source IDs that appear in the data
  const activeSources = useMemo(() => {
    const ids = new Set(items.map((i) => i.sourceId));
    return sources.filter((s) => ids.has(s.id));
  }, [items, sources]);

  // Also include Hacker News if present
  const hnPresent = useMemo(() => items.some((i) => i.sourceId === "hacker-news"), [items]);

  const filtered = useMemo(() => {
    let result = items;

    if (tab !== "all") {
      result = result.filter((i) => i.sourceType === tab);
    }
    if (sourceId) {
      result = result.filter((i) => i.sourceId === sourceId);
    }
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

  const counts: Record<FilterTab, number> = useMemo(
    () => ({
      all:        items.length,
      news:       items.filter((i) => i.sourceType === "news").length,
      newsletter: items.filter((i) => i.sourceType === "newsletter").length,
      blog:       items.filter((i) => i.sourceType === "blog").length,
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
            Top stories from VentureBeat, TechCrunch, The Verge, Wired, OpenAI, Google AI, TLDR AI,
            Import AI, Ben&apos;s Bites, and Hacker News — refreshed every 24 hours.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted/60 mt-3">
            <RefreshCw className="h-3 w-3" />
            Last fetched {relativeTime(fetchedAt)} · {items.length} articles
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-md mb-8">
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
        </div>

        {/* ── Type tabs ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === id
                  ? "bg-accent text-black shadow-sm shadow-accent/20"
                  : "bg-card/40 border border-border/40 text-muted hover:text-foreground hover:border-border/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={`text-xs ${tab === id ? "text-black/70" : "text-muted/70"}`}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Source chips ── */}
        <div className="flex flex-wrap gap-2 mb-8">
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                    active
                      ? `${c.bg} ${c.text} border-current/30`
                      : "text-muted border-transparent hover:text-foreground"
                  }`}
                >
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
        </div>

        {/* ── Article grid ── */}
        {filtered.length > 0 ? (
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
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-muted/50 mt-14">
          Articles link directly to their original sources. Panda Apps does not store or reproduce content.
        </p>
      </div>
    </div>
  );
}
