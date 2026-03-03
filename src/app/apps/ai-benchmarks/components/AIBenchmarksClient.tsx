"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot, ChevronLeft, ChevronDown, ChevronUp, ChevronsUpDown,
  Info, ExternalLink, Search, Lock, Cpu, Gift,
} from "lucide-react";
import { MODELS, BENCHMARK_COLS, type BenchmarkModel } from "../data/frontierData";

type BenchKey = "gpqa" | "swe" | "arcagi2" | "arenaElo" | "aaIndex";
type SortKey = "name" | "provider" | BenchKey;
type SortDir = "asc" | "desc";
type TabFilter = "all" | "free" | "opensource";

// Normalise scores to 0-100 for colour coding
function normVal(v: number | null, key: BenchKey): number | null {
  if (v === null) return null;
  if (key === "arenaElo") return Math.min(100, Math.max(0, ((v - 1250) / 300) * 100));
  if (key === "aaIndex") return Math.min(100, Math.max(0, (v / 60) * 100));
  return v;
}

function scoreColor(v: number | null, key: BenchKey): string {
  const p = normVal(v, key);
  if (p === null) return "text-muted/40";
  if (p >= 88) return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (p >= 72) return "text-green-600 dark:text-green-400 font-semibold";
  if (p >= 56) return "text-lime-600 dark:text-lime-400";
  if (p >= 40) return "text-yellow-600 dark:text-yellow-400";
  if (p >= 24) return "text-amber-600 dark:text-amber-400";
  if (p >= 10) return "text-orange-600 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBg(v: number | null, key: BenchKey): string {
  const p = normVal(v, key);
  if (!p || p < 72) return "";
  if (p >= 88) return "bg-emerald-500/15";
  return "bg-green-500/10";
}

function fmt(v: number | null, key: BenchKey): string {
  if (v === null) return "\u2014";
  if (key === "arenaElo") return v.toFixed(0);
  if (key === "aaIndex") return v.toFixed(0);
  return v.toFixed(1) + "%";
}

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-violet-500" /> : <ChevronDown className="h-3 w-3 text-violet-500" />;
}

export default function AIBenchmarksClient() {
  const [sortKey, setSortKey] = useState<SortKey>("arenaElo");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) { setSortDir(d => d === "desc" ? "asc" : "desc"); }
    else { setSortKey(key); setSortDir(["name","provider"].includes(key) ? "asc" : "desc"); }
  }

  const sorted = useMemo(() => {
    let rows: BenchmarkModel[] = MODELS;
    if (tab === "free") rows = rows.filter(m => m.isFree);
    if (tab === "opensource") rows = rows.filter(m => m.isOpenSource);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
    return [...rows].sort((a, b) => {
      const av = (sortKey === "name" || sortKey === "provider") ? a[sortKey] : a[sortKey as BenchKey];
      const bv = (sortKey === "name" || sortKey === "provider") ? b[sortKey] : b[sortKey as BenchKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [tab, search, sortKey, sortDir]);

  const TABS = [
    { id: "all" as const,        label: "All Models",  icon: <Bot className="h-3.5 w-3.5" />,  count: MODELS.length },
    { id: "free" as const,       label: "Free Tier",   icon: <Gift className="h-3.5 w-3.5" />, count: MODELS.filter(m => m.isFree).length },
    { id: "opensource" as const, label: "Open Source", icon: <Cpu className="h-3.5 w-3.5" />,  count: MODELS.filter(m => m.isOpenSource).length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Back
          </Link>
          <span className="text-border/60">&#183;</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Bot className="h-4 w-4 text-violet-500" />AI Model Benchmarks
          </span>
          <span className="ml-auto text-xs text-muted hidden sm:block">Data: March 2026</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">AI Model Benchmarks</h1>
          <p className="text-muted max-w-2xl text-sm">
            Verified scores for <strong className="text-foreground">{MODELS.length} frontier models</strong> across 5 key benchmarks &#8212; sourced from official leaderboards and model technical reports. Click any row to expand.
          </p>
        </div>

        {/* benchmark legend cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {BENCHMARK_COLS.map(col => (
            <a key={col.key} href={col.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="group rounded-xl border border-border/30 bg-card/50 px-3 py-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-bold text-violet-500 group-hover:underline">{col.fullName}</p>
                <ExternalLink className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-muted leading-tight">{col.desc}</p>
            </a>
          ))}
        </div>

        {/* tabs + search row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex rounded-xl border border-border/40 overflow-hidden shrink-0 text-sm">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  tab === t.id ? "bg-violet-500 text-white" : "text-muted hover:text-foreground hover:bg-muted/10"
                }`}>
                {t.icon}
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${tab === t.id ? "bg-white/20" : "bg-muted/20"}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search models&#8230;"
              className="w-full rounded-xl border border-border/40 bg-card/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted focus:border-violet-500/60 focus:outline-none transition-colors" />
          </div>
          <p className="text-xs text-muted">
            {tab === "free" && "Free tier API or free web interface available"}
            {tab === "opensource" && "Open-weight — download and self-host"}
          </p>
        </div>

        {/* table */}
        <div className="rounded-2xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/5">
                  <th onClick={() => handleSort("name")}
                    className="px-3 py-3 text-left text-xs font-semibold text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap">
                    <span className="flex items-center gap-1">Model <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                  {BENCHMARK_COLS.map(col => (
                    <th key={col.key} title={col.fullName}
                      onClick={() => handleSort(col.key as BenchKey)}
                      className="px-3 py-3 text-left text-xs font-semibold text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap">
                      <span className="flex items-center gap-1">{col.label} <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} /></span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">Access</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={BENCHMARK_COLS.length + 2} className="px-3 py-12 text-center text-muted text-sm">
                      No models match your filters
                    </td>
                  </tr>
                ) : sorted.flatMap(m => {
                  const isExpanded = expanded === m.id;
                  return [
                    <tr key={m.id} onClick={() => setExpanded(isExpanded ? null : m.id)}
                      className={`border-b border-border/20 cursor-pointer transition-colors hover:bg-violet-500/5 ${isExpanded ? "bg-violet-500/8" : ""}`}>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-medium ${m.providerColor} block`}>{m.provider}</span>
                        <span className="text-sm font-semibold">{m.name}</span>
                        {m.params && <span className="text-[10px] text-muted ml-1.5 font-mono">{m.params}</span>}
                      </td>
                      {BENCHMARK_COLS.map(col => {
                        const v = m[col.key as BenchKey];
                        return (
                          <td key={col.key} className={`px-3 py-2.5 ${scoreBg(v, col.key as BenchKey)}`}>
                            <span className={`text-sm tabular-nums ${scoreColor(v, col.key as BenchKey)}`}>{fmt(v, col.key as BenchKey)}</span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {m.isOpenSource && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-fit">
                              <Cpu className="h-2.5 w-2.5" />Open
                            </span>
                          )}
                          {m.isFree && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 w-fit">
                              <Gift className="h-2.5 w-2.5" />Free
                            </span>
                          )}
                          {!m.isFree && !m.isOpenSource && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-muted/20 text-muted w-fit">
                              <Lock className="h-2.5 w-2.5" />Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>,
                    ...(isExpanded ? [
                      <tr key={`${m.id}-exp`} className="bg-violet-500/5 border-b border-violet-500/20">
                        <td colSpan={BENCHMARK_COLS.length + 2} className="px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                            {BENCHMARK_COLS.map(col => {
                              const v = m[col.key as BenchKey];
                              return (
                                <a key={col.key} href={col.sourceUrl} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="group rounded-lg border border-border/30 bg-background/60 px-3 py-2 hover:border-violet-500/40 transition-all">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-violet-500 group-hover:underline">{col.fullName}</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-muted" />
                                  </div>
                                  <p className={`text-xl font-bold tabular-nums ${scoreColor(v, col.key as BenchKey)}`}>{fmt(v, col.key as BenchKey)}</p>
                                  <p className="text-[10px] text-muted mt-0.5">{col.source}</p>
                                </a>
                              );
                            })}
                          </div>
                          <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
                            {m.params && <span><span className="text-foreground font-medium">Params:</span> {m.params}</span>}
                            <span><span className="text-foreground font-medium">Released:</span> {m.releasedAt}</span>
                            <span><span className="text-foreground font-medium">License:</span> {m.isOpenSource ? "Open weights" : "Proprietary"}</span>
                            <span><span className="text-foreground font-medium">Access:</span> {m.isFree ? "Free tier available" : "Paid API only"}</span>
                          </div>
                        </td>
                      </tr>
                    ] : [])
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* score scale */}
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <span className="font-medium text-foreground mr-1">Scale:</span>
          {[
            { label: "Top tier", cls: "text-emerald-600 dark:text-emerald-400 font-bold" },
            { label: "Strong",   cls: "text-green-600 dark:text-green-400 font-semibold" },
            { label: "Good",     cls: "text-lime-600 dark:text-lime-400" },
            { label: "Average",  cls: "text-yellow-600 dark:text-yellow-400" },
            { label: "Weak",     cls: "text-amber-600 dark:text-amber-400" },
            { label: "Poor",     cls: "text-red-500 dark:text-red-400" },
          ].map(s => <span key={s.label} className={s.cls}>{s.label}</span>)}
          <span className="text-muted ml-1">&#8212; Arena ELO normalised to 1250&#8211;1550 range for colour</span>
        </div>

        {/* sources note */}
        <div className="rounded-2xl border border-border/30 bg-card/30 px-5 py-4 flex gap-3">
          <Info className="h-4 w-4 text-muted shrink-0 mt-0.5" />
          <div className="text-xs text-muted leading-relaxed space-y-1.5">
            {BENCHMARK_COLS.map(col => (
              <p key={col.key}>
                <strong className="text-foreground">{col.fullName}:</strong> {col.desc}{" "}
                Source: <a href={col.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">{col.source}</a>.
              </p>
            ))}
            <p className="text-muted/70 pt-1">
              &#8212; not officially benchmarked / not publicly reported for that model.
              Data verified March 2026. SWE-bench and Arena scores are agentic/interactive and may vary by setup.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
