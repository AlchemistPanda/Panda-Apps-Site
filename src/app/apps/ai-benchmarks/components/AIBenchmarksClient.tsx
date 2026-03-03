"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Info,
  ExternalLink,
  Sparkles,
  Lock,
  Globe,
  Trophy,
  BookOpen,
  Zap,
  RefreshCw,
  Pin,
} from "lucide-react";
import {
  MODELS,
  BENCHMARKS,
  CATEGORIES,
  PROVIDERS,
  avgScore,
  DATA_DATE,
  type BenchmarkId,
  type CategoryId,
  type ModelScore,
} from "../data/benchmarkData";

type SortDir = "asc" | "desc";
type SortKey = "name" | "avg" | BenchmarkId;

function scoreColor(pct: number): string {
  // pct is 0-100 (normalised)
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (pct >= 80) return "text-green-600 dark:text-green-400 font-semibold";
  if (pct >= 70) return "text-lime-600 dark:text-lime-400 font-semibold";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  if (pct >= 35) return "text-orange-600 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBg(pct: number): string {
  if (pct >= 90) return "bg-emerald-500/15";
  if (pct >= 80) return "bg-green-500/10";
  if (pct >= 70) return "bg-lime-500/10";
  if (pct >= 60) return "bg-yellow-500/10";
  if (pct >= 50) return "bg-amber-500/10";
  if (pct >= 35) return "bg-orange-500/10";
  return "bg-red-500/10";
}

function displayScore(raw: number, benchmarkId: BenchmarkId): string {
  const b = BENCHMARKS[benchmarkId];
  if (b.unit === "/10") return raw.toFixed(2);
  return raw.toFixed(1) + "%";
}

function normalise(raw: number, benchmarkId: BenchmarkId): number {
  return (raw / BENCHMARKS[benchmarkId].max) * 100;
}

function InfoTooltip({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info className="h-3 w-3 text-muted cursor-help ml-1 shrink-0" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl bg-popover border border-border shadow-lg p-3 text-xs text-muted z-50 pointer-events-none leading-relaxed">
          {children}
        </span>
      )}
    </span>
  );
}

function SortIcon({ field, sort }: { field: string; sort: { key: string; dir: SortDir } }) {
  if (sort.key !== field) return <ChevronsUpDown className="h-3 w-3 text-muted/50 inline ml-0.5" />;
  return sort.dir === "desc"
    ? <ChevronDown className="h-3 w-3 text-accent inline ml-0.5" />
    : <ChevronUp className="h-3 w-3 text-accent inline ml-0.5" />;
}

export default function AIBenchmarksClient() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "avg", dir: "desc" });
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelScore | null>(null);

  const category = CATEGORIES.find((c) => c.id === activeCategory)!;
  const benchmarkIds = category.benchmarks as BenchmarkId[];

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" }
    );
  }

  const sortedModels = useMemo(() => {
    let filtered = [...MODELS];
    if (showOnlyNew) filtered = filtered.filter((m) => m.isNew);
    if (showOnlyOpen) filtered = filtered.filter((m) => m.isOpenSource);

    filtered.sort((a, b) => {
      let va: number | null, vb: number | null;
      if (sort.key === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sort.dir === "asc" ? cmp : -cmp;
      }
      if (sort.key === "avg") {
        va = avgScore(a, benchmarkIds);
        vb = avgScore(b, benchmarkIds);
      } else {
        const raw_a = a.scores[sort.key as BenchmarkId];
        const raw_b = b.scores[sort.key as BenchmarkId];
        va = raw_a != null ? normalise(raw_a, sort.key as BenchmarkId) : null;
        vb = raw_b != null ? normalise(raw_b, sort.key as BenchmarkId) : null;
      }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return sort.dir === "desc" ? vb - va : va - vb;
    });
    return filtered;
  }, [sort, showOnlyNew, showOnlyOpen, benchmarkIds]);

  // Min/max per benchmark for heat map (among displayed models)
  const benchmarkRange = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    for (const bid of benchmarkIds) {
      const vals = MODELS.map((m) => m.scores[bid]).filter((v) => v != null) as number[];
      if (vals.length === 0) continue;
      ranges[bid] = { min: Math.min(...vals), max: Math.max(...vals) };
    }
    return ranges;
  }, [benchmarkIds]);

  const rankMap = useMemo(() => {
    const ranked = [...MODELS]
      .map((m) => ({ id: m.id, avg: avgScore(m, benchmarkIds) }))
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
    const m: Record<string, number> = {};
    ranked.forEach((r, i) => { m[r.id] = i + 1; });
    return m;
  }, [benchmarkIds]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link href="/#apps" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Back
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">AI Model Benchmarks</span>
          </div>
          <div className="ml-auto text-xs text-muted hidden sm:block">
            Updated: {DATA_DATE}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-xs font-medium text-violet-500 mb-2">
            <Pin className="h-3 w-3" />
            Scores pinned to {DATA_DATE}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">AI Model Benchmarks</h1>
          <p className="text-muted max-w-2xl mx-auto">
            Verified scores from official model technical reports &amp; peer-reviewed leaderboards.
            {" "}{MODELS.length} models · {Object.keys(BENCHMARKS).length} benchmarks.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xl mx-auto">
            AI moves fast — scores here are verified snapshots. For the latest model releases, use the live leaderboards below.
          </p>
        </div>

        {/* ── Live Leaderboards ───────────────────────────────────── */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            <span className="font-semibold text-sm">Always-Up-To-Date Live Sources</span>
            <span className="text-xs text-muted ml-1">— bookmark these for the latest models &amp; rankings</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                name: "LMSYS Chatbot Arena",
                desc: "Human-preference ELO ranking. The most comprehensive live leaderboard — covers every major closed & open model including latest GPT, Claude, Gemini, Grok releases.",
                url: "https://lmarena.ai/?leaderboard",
                badge: "Best overall",
                badgeCls: "bg-violet-500/20 text-violet-500",
              },
              {
                name: "Artificial Analysis",
                desc: "Independent quality + speed + price benchmarking across all frontier APIs. Updated within days of new releases. Best for comparing real-world output quality.",
                url: "https://artificialanalysis.ai/leaderboards/models",
                badge: "Quality + Speed",
                badgeCls: "bg-blue-500/20 text-blue-500",
              },
              {
                name: "HF Open LLM Leaderboard",
                desc: "Hugging Face community leaderboard for open-weight models. Runs standardised evals on MMLU, IFEval, BBH, GPQA, and more automatically on new model submissions.",
                url: "https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard",
                badge: "Open source",
                badgeCls: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
              },
              {
                name: "SWE-bench Leaderboard",
                desc: "Live rankings for real GitHub issue resolution. The gold standard for agentic coding ability — updated as labs submit new agent runs.",
                url: "https://www.swebench.com",
                badge: "Coding / Agents",
                badgeCls: "bg-orange-500/20 text-orange-500",
              },
              {
                name: "LiveCodeBench",
                desc: "Contamination-free competitive programming. New problems added monthly from Codeforces, LeetCode & AtCoder to prevent data leakage.",
                url: "https://livecodebench.github.io/leaderboard.html",
                badge: "Coding",
                badgeCls: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
              },
              {
                name: "Aider LLM Leaderboard",
                desc: "Measures how well models edit real codebases (not just write new code). Covers latest GPT-4.1, Claude 3.7, Gemini 2.5 and more.",
                url: "https://aider.chat/docs/leaderboards/",
                badge: "Code editing",
                badgeCls: "bg-teal-500/20 text-teal-600 dark:text-teal-400",
              },
            ].map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2 rounded-xl border border-border/40 bg-background/60 p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm group-hover:text-violet-500 transition-colors">{src.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5 group-hover:text-violet-500 transition-colors" />
                </div>
                <span className={`self-start text-[10px] font-semibold rounded-full px-2 py-0.5 ${src.badgeCls}`}>{src.badge}</span>
                <p className="text-xs text-muted leading-relaxed">{src.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSort({ key: "avg", dir: "desc" }); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border
                ${activeCategory === cat.id
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border/40 text-muted hover:text-foreground hover:border-border"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowOnlyNew((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors
              ${showOnlyNew ? "bg-violet-500/20 border-violet-500/40 text-violet-500" : "border-border/40 text-muted hover:text-foreground"}`}
          >
            <Sparkles className="h-3 w-3" />
            Latest Models Only
          </button>
          <button
            onClick={() => setShowOnlyOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors
              ${showOnlyOpen ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-border/40 text-muted hover:text-foreground"}`}
          >
            <Globe className="h-3 w-3" />
            Open Source Only
          </button>
          <span className="text-xs text-muted ml-auto">{sortedModels.length} models shown</span>
        </div>

        {/* Benchmark legend strips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {benchmarkIds.map((bid) => {
            const b = BENCHMARKS[bid];
            return (
              <div key={bid} className="rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 flex items-start gap-2">
                <BookOpen className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-foreground truncate">{b.shortName}</span>
                    <InfoTooltip>
                      <strong className="text-foreground block mb-1">{b.name}</strong>
                      {b.description}
                      <a href={b.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent mt-2 hover:underline">
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </InfoTooltip>
                  </div>
                  <p className="text-[11px] text-muted truncate leading-tight">{b.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main leaderboard table */}
        <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-black/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide min-w-[200px]">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Model <SortIcon field="name" sort={sort} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-accent uppercase tracking-wide">
                    <button onClick={() => toggleSort("avg")} className="flex items-center gap-1 hover:text-accent/80 transition-colors ml-auto">
                      Avg Score <SortIcon field="avg" sort={sort} />
                    </button>
                  </th>
                  {benchmarkIds.map((bid) => (
                    <th key={bid} className="text-right px-3 py-3 text-xs font-semibold text-muted uppercase tracking-wide min-w-[90px]">
                      <button onClick={() => toggleSort(bid)} className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
                        {BENCHMARKS[bid].shortName} <SortIcon field={bid} sort={sort} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedModels.map((model) => {
                  const rank = rankMap[model.id];
                  const avg = avgScore(model, benchmarkIds);
                  const prov = PROVIDERS[model.provider];

                  return (
                    <tr
                      key={model.id}
                      className="border-b border-border/20 hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3 text-xs text-muted font-mono">
                        {rank <= 3 ? (
                          <span className={rank === 1 ? "text-amber-400" : rank === 2 ? "text-slate-400" : "text-amber-700"}>
                            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : rank}
                      </td>

                      {/* Model name */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm">{model.name}</span>
                              {model.isNew && (
                                <span className="text-[10px] bg-violet-500/20 text-violet-500 rounded px-1.5 py-0.5 font-semibold">NEW</span>
                              )}
                              {model.isOpenSource && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 font-semibold flex items-center gap-0.5">
                                  <Globe className="h-2.5 w-2.5" />OS
                                </span>
                              )}
                              {!model.isOpenSource && (
                                <span className="text-[10px] bg-slate-500/10 text-muted rounded px-1.5 py-0.5 font-medium flex items-center gap-0.5">
                                  <Lock className="h-2.5 w-2.5" />Closed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[11px] font-medium ${prov.color}`}>{prov.name}</span>
                              <span className="text-[11px] text-muted">{model.releasedAt.slice(0, 7)}</span>
                              {model.contextWindow && (
                                <span className="text-[11px] text-muted">{model.contextWindow} ctx</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Avg score */}
                      <td className="px-4 py-3 text-right">
                        {avg != null ? (
                          <span className={`rounded-lg px-2.5 py-1 text-sm tabular-nums ${scoreBg(avg)} ${scoreColor(avg)}`}>
                            {avg.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Per-benchmark scores */}
                      {benchmarkIds.map((bid) => {
                        const raw = model.scores[bid];
                        if (raw == null) {
                          return <td key={bid} className="px-3 py-3 text-right"><span className="text-muted/40 text-xs">—</span></td>;
                        }
                        const pct = normalise(raw, bid);
                        return (
                          <td key={bid} className="px-3 py-3 text-right tabular-nums">
                            <span className={`rounded-md px-2 py-0.5 text-xs ${scoreBg(pct)} ${scoreColor(pct)}`}>
                              {displayScore(raw, bid)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model detail panel */}
        {selectedModel && (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg">{selectedModel.name}</h3>
                  {selectedModel.isNew && (
                    <span className="text-xs bg-violet-500/20 text-violet-500 rounded-full px-2.5 py-0.5 font-semibold">NEW</span>
                  )}
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium mt-2 ${PROVIDERS[selectedModel.provider].bg} ${PROVIDERS[selectedModel.provider].color}`}>
                  {PROVIDERS[selectedModel.provider].name}
                </div>
              </div>
              <button onClick={() => setSelectedModel(null)} className="text-muted hover:text-foreground text-xs border border-border/40 rounded-lg px-3 py-1.5">
                Close
              </button>
            </div>

            {/* Model meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: "Released", value: selectedModel.releasedAt },
                { label: "Context", value: selectedModel.contextWindow },
                { label: "Parameters", value: selectedModel.parameterCount ?? "—" },
                { label: "Access", value: selectedModel.isOpenSource ? "Open Source" : "Closed / API" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/30 bg-background/50 px-3 py-2.5">
                  <p className="text-muted mb-0.5">{item.label}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            {selectedModel.notes && (
              <p className="text-sm text-muted border-l-2 border-border/60 pl-3 leading-relaxed">
                {selectedModel.notes}
              </p>
            )}

            {/* All scores for this model */}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">All Official Scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {(Object.entries(selectedModel.scores) as [BenchmarkId, number | null][])
                  .filter(([, v]) => v != null)
                  .map(([bid, raw]) => {
                    const pct = normalise(raw!, bid);
                    const b = BENCHMARKS[bid];
                    return (
                      <div key={bid} className={`rounded-xl border border-border/30 px-3 py-2.5 ${scoreBg(pct)}`}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-muted truncate">{b.shortName}</span>
                          <span className={`text-sm font-bold tabular-nums ${scoreColor(pct)}`}>{displayScore(raw!, bid)}</span>
                        </div>
                        <p className="text-[10px] text-muted/60 mt-0.5 truncate">{b.name}</p>
                      </div>
                    );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Score colour legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/30 bg-card/50 px-4 py-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Score scale</span>
          {[
            { range: "≥ 90%", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15" },
            { range: "80–90%", cls: "text-green-600 dark:text-green-400 bg-green-500/10" },
            { range: "70–80%", cls: "text-lime-600 dark:text-lime-400 bg-lime-500/10" },
            { range: "60–70%", cls: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10" },
            { range: "50–60%", cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
            { range: "35–50%", cls: "text-orange-600 dark:text-orange-400 bg-orange-500/10" },
            { range: "< 35%",  cls: "text-red-500 dark:text-red-400 bg-red-500/10" },
          ].map((s) => (
            <span key={s.range} className={`text-xs font-medium rounded-md px-2 py-0.5 ${s.cls}`}>{s.range}</span>
          ))}
        </div>

        {/* Sources & methodology */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Why scores are pinned — not live
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Benchmark scores change when labs re-run evals with different prompts, few-shot settings, or sampling temperatures.
            Publishing unverified numbers risks spreading misinformation. Every score in this table is taken directly from
            an <strong className="text-foreground">official model technical report or system card</strong> — not scraped or estimated.
            This snapshot was last verified on <strong className="text-foreground">{DATA_DATE}</strong>.
            For models released after that date (Claude 4, GPT-4.1, Gemini 2.5, etc.), use the live leaderboards above
            which are maintained by the respective organisations and the research community.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            MT-Bench scores are on a 1–10 scale; all others are percentages. &ldquo;Avg Score&rdquo; normalises all
            benchmarks to 0–100 and averages only the ones officially reported for that model.
          </p>
        </div>
      </main>
    </div>
  );
}
