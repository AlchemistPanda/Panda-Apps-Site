"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot, ChevronLeft, ChevronDown, ChevronUp, ChevronsUpDown,
  Info, ExternalLink, Search, Lock, Cpu, Gift,
  BarChart3, Target, Table2, ArrowUpRight, RefreshCw,
  Code2, Brain, Eye, MessageSquare, HardDrive, Filter, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, Legend,
  ScatterChart, Scatter, LabelList,
} from "recharts";
import {
  MODELS as STATIC_MODELS,
  BENCHMARK_COLS,
  type BenchmarkModel,
  type ModelTag,
  DATA_DATE,
} from "../data/frontierData";
import ThemeToggle from "@/components/ThemeToggle";

/* ═══════════════ Constants ═══════════════ */

const PCOLOR: Record<string, string> = {
  Anthropic: "#f97316",
  Google: "#3b82f6",
  OpenAI: "#22c55e",
  xAI: "#a855f7",
  "Z.ai": "#14b8a6",
  Alibaba: "#f59e0b",
  Moonshot: "#06b6d4",
  DeepSeek: "#6366f1",
  MiniMax: "#f43f5e",
  Mistral: "#ec4899",
  Meta: "#0ea5e9",
};
const pc = (p: string) => PCOLOR[p] || "#8b5cf6";

/* ═══════════════ Types ═══════════════ */

type BenchKey = "gpqa" | "swe" | "arcagi2" | "arenaElo" | "aaIndex";
type SortKey = "name" | "provider" | BenchKey;
type SortDir = "asc" | "desc";
type TabFilter = "all" | "free" | "opensource" | "local";
type ViewTab = "charts" | "radar" | "table";

const TAG_CONFIG: { id: ModelTag; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "coding", label: "Coding", icon: <Code2 className="h-3 w-3" />, color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40" },
  { id: "reasoning", label: "Reasoning", icon: <Brain className="h-3 w-3" />, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40" },
  { id: "multimodal", label: "Multimodal", icon: <Eye className="h-3 w-3" />, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40" },
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-3 w-3" />, color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40" },
];

/* ═══════════════ Utilities ═══════════════ */

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
  if (key === "arenaElo" || key === "aaIndex") return v.toFixed(0);
  return v.toFixed(1) + "%";
}

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-violet-500" />
    : <ChevronDown className="h-3 w-3 text-violet-500" />;
}

/* ═══════════════ Chart: Custom Tooltips ═══════════════ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-white dark:bg-gray-900 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill || p.color || p.stroke }} />
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">{p.name}:</span>{" "}
            {typeof p.value === "number" ? (Number.isInteger(p.value) ? p.value : p.value.toFixed(1)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-white dark:bg-gray-900 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{d.name}</p>
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">Provider:</span> {d.provider}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">Arena ELO:</span> {d.arenaElo}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">AA Index:</span> {d.aaIndex}
      </p>
    </div>
  );
}

/* ═══════════════ Chart: Benchmark Horizontal Bars ═══════════════ */

function BenchmarkBarChart({ benchKey, models }: { benchKey: BenchKey; models: BenchmarkModel[] }) {
  const col = BENCHMARK_COLS.find(c => c.key === benchKey)!;

  const data = useMemo(
    () =>
      models
        .filter(m => m[benchKey] !== null)
        .sort((a, b) => ((b[benchKey] as number) ?? 0) - ((a[benchKey] as number) ?? 0))
        .map(m => ({
          name: m.name,
          value: m[benchKey] as number,
          provider: m.provider,
          fill: pc(m.provider),
        })),
    [benchKey, models],
  );

  if (data.length === 0)
    return <p className="text-muted text-sm py-8 text-center">No data available for this benchmark</p>;

  const xDomain: [number, number] =
    benchKey === "arenaElo"
      ? [
          Math.floor((data[data.length - 1]?.value ?? 1300) / 10) * 10 - 10,
          Math.ceil((data[0]?.value ?? 1500) / 10) * 10 + 10,
        ]
      : benchKey === "aaIndex"
        ? [0, Math.ceil((data[0]?.value ?? 60) / 5) * 5 + 5]
        : [0, 100];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-bold">{col.fullName}</h3>
        <a
          href={col.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-500 hover:underline text-xs flex items-center gap-0.5"
        >
          Source <ArrowUpRight className="h-2.5 w-2.5" />
        </a>
      </div>
      <p className="text-xs text-muted mb-4">{col.desc}</p>

      <div className="overflow-x-auto -mx-2 px-2">
        <div style={{ minWidth: 600 }}>
          <ResponsiveContainer width="100%" height={data.length * 34 + 40}>
            <BarChart layout="vertical" data={data} margin={{ left: 0, right: 50, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#6b728022" />
              <XAxis
                type="number"
                domain={xDomain}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={{ stroke: "#6b728033" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
              <Bar dataKey="value" name={col.label} radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((e, i) => (
                  <Cell key={i} fill={e.fill} fillOpacity={0.85} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  fontSize={10}
                  fill="#9ca3af"
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    if (!isFinite(n)) return "";
                    return benchKey === "arenaElo" || benchKey === "aaIndex" ? n.toFixed(0) : n.toFixed(1) + "%";
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px]">
        {[...new Set(data.map(d => d.provider))].map(p => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pc(p) }} />
            <span className="text-muted">{p}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Chart: Radar Compare ═══════════════ */

function RadarCompareChart({ selectedIds, models }: { selectedIds: string[]; models: BenchmarkModel[] }) {
  const selectedModels = models.filter(m => selectedIds.includes(m.id));

  const radarData = useMemo(() => {
    const benchmarks: { key: BenchKey; label: string }[] = [
      { key: "gpqa", label: "GPQA Diamond" },
      { key: "swe", label: "SWE-bench" },
      { key: "arcagi2", label: "ARC-AGI 2" },
      { key: "arenaElo", label: "Arena ELO" },
      { key: "aaIndex", label: "AA Index" },
    ];

    // Min-max normalization per benchmark (relative to all models in the dataset)
    const ranges = Object.fromEntries(
      benchmarks.map(b => {
        const vals = models.map(m => m[b.key]).filter((v): v is number => v !== null);
        if (vals.length === 0) return [b.key, { min: 0, max: 1 }];
        return [b.key, { min: Math.min(...vals), max: Math.max(...vals) }];
      }),
    );

    return benchmarks.map(b => {
      const row: Record<string, any> = { benchmark: b.label };
      const { min, max } = ranges[b.key];
      const range = max - min || 1;
      selectedModels.forEach(m => {
        const val = m[b.key];
        row[m.id] = val !== null ? Math.round(((val - min) / range) * 100) : 0;
      });
      return row;
    });
  }, [selectedIds, selectedModels, models]);

  if (selectedModels.length === 0) {
    return <p className="text-muted text-sm text-center py-12">Select models below to compare</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={420}>
      <RadarChart data={radarData} cx="50%" cy="50%">
        <PolarGrid stroke="#6b728033" />
        <PolarAngleAxis dataKey="benchmark" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#6b7280" }} tickCount={5} />
        {selectedModels.map(m => (
          <Radar
            key={m.id}
            name={m.name}
            dataKey={m.id}
            stroke={pc(m.provider)}
            fill={pc(m.provider)}
            fillOpacity={0.12}
            strokeWidth={2}
            dot={{ r: 3, fill: pc(m.provider) }}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
        <Tooltip content={<ChartTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════ Chart: Scatter — Arena ELO vs AA Index ═══════════════ */

function EloVsIndexScatter({ models }: { models: BenchmarkModel[] }) {
  const data = useMemo(
    () =>
      models
        .filter(m => m.arenaElo !== null && m.aaIndex !== null)
        .map(m => ({
          name: m.name,
          arenaElo: m.arenaElo!,
          aaIndex: m.aaIndex!,
          provider: m.provider,
          fill: pc(m.provider),
        })),
    [models],
  );

  return (
    <div>
      <h3 className="text-lg font-bold mb-1">Arena ELO vs Intelligence Index</h3>
      <p className="text-xs text-muted mb-4">
        Human preference (Arena) vs composite intelligence (AA Index). Models in the top-right corner excel at both.
      </p>
      <div className="overflow-x-auto -mx-2 px-2">
        <div style={{ minWidth: 500 }}>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6b728022" />
              <XAxis
                type="number"
                dataKey="arenaElo"
                name="Arena ELO"
                domain={["dataMin - 20", "dataMax + 20"]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                label={{ value: "Arena ELO \u2192", position: "bottom", offset: 15, fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                type="number"
                dataKey="aaIndex"
                name="AA Index"
                domain={["dataMin - 3", "dataMax + 3"]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                label={{
                  value: "AA Index \u2192",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  fontSize: 11,
                  fill: "#6b7280",
                }}
              />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#6b728044" }} />
              <Scatter data={data} fill="#8b5cf6">
                {data.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Provider legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px]">
        {[...new Set(data.map(d => d.provider))].map(p => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pc(p) }} />
            <span className="text-muted">{p}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Main Component ═══════════════ */

type Props = { models?: BenchmarkModel[] };

export default function AIBenchmarksClient({ models }: Props) {
  const MODELS = models ?? STATIC_MODELS;

  /* ── state ── */
  const [view, setView] = useState<ViewTab>("charts");
  const [selectedBench, setSelectedBench] = useState<BenchKey>("aaIndex");
  const [sortKey, setSortKey] = useState<SortKey>("arenaElo");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [radarModels, setRadarModels] = useState<string[]>([
    "claude-opus-4-6",
    "gemini-3-1-pro",
    "gpt-5-2",
  ]);
  const [activeTags, setActiveTags] = useState<ModelTag[]>([]);

  /* ── tag toggle ── */
  function toggleTag(tag: ModelTag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }

  /* ── sort handler ── */
  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir(["name", "provider"].includes(key) ? "asc" : "desc");
    }
  }

  /* ── filtered + sorted data ── */
  const filtered = useMemo(() => {
    let rows: BenchmarkModel[] = MODELS;
    if (tab === "free") rows = rows.filter(m => m.isFree);
    if (tab === "opensource") rows = rows.filter(m => m.isOpenSource);
    if (tab === "local") rows = rows.filter(m => m.canRunLocally);
    if (activeTags.length > 0) rows = rows.filter(m => activeTags.every(t => m.tags.includes(t)));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
    return rows;
  }, [MODELS, tab, search, activeTags]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const av = sortKey === "name" || sortKey === "provider" ? a[sortKey] : a[sortKey as BenchKey];
        const bv = sortKey === "name" || sortKey === "provider" ? b[sortKey] : b[sortKey as BenchKey];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === "string")
          return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
      }),
    [filtered, sortKey, sortDir],
  );

  /* ── tab counts ── */
  const FILTER_TABS = [
    { id: "all" as const, label: "All", icon: <Bot className="h-3.5 w-3.5" />, count: MODELS.length },
    {
      id: "free" as const,
      label: "Free",
      icon: <Gift className="h-3.5 w-3.5" />,
      count: MODELS.filter(m => m.isFree).length,
    },
    {
      id: "opensource" as const,
      label: "Open Source",
      icon: <Cpu className="h-3.5 w-3.5" />,
      count: MODELS.filter(m => m.isOpenSource).length,
    },
    {
      id: "local" as const,
      label: "Run Locally",
      icon: <HardDrive className="h-3.5 w-3.5" />,
      count: MODELS.filter(m => m.canRunLocally).length,
    },
  ];

  /* ── top stats ── */
  const topModel = MODELS.reduce((a, b) => ((a.aaIndex ?? 0) > (b.aaIndex ?? 0) ? a : b));
  const topArena = MODELS.reduce((a, b) => ((a.arenaElo ?? 0) > (b.arenaElo ?? 0) ? a : b));

  /* ═══════════════ Render ═══════════════ */
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">&middot;</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Bot className="h-4 w-4 text-violet-500" />
            AI Model Benchmarks
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-500/10 rounded-full px-2.5 py-1">
              <RefreshCw className="h-2.5 w-2.5" />
              Auto-updates
            </span>
            <span className="text-xs text-muted hidden sm:block">Data: {DATA_DATE}</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* ── Hero ── */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">AI Model Benchmarks</h1>
          <p className="text-muted max-w-2xl text-sm">
            Verified scores for <strong className="text-foreground">{MODELS.length} frontier models</strong> across 5
            key benchmarks &mdash; sourced from official leaderboards. Charts auto-refresh daily via ISR.
          </p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Models Tracked", value: String(MODELS.length), accent: "text-violet-500" },
            {
              label: "Top Intelligence",
              value: topModel.name,
              sub: `Score: ${topModel.aaIndex}`,
              accent: "text-emerald-500",
            },
            {
              label: "Top Arena ELO",
              value: topArena.name,
              sub: `ELO: ${topArena.arenaElo}`,
              accent: "text-blue-500",
            },
            {
              label: "Open Source",
              value: String(MODELS.filter(m => m.isOpenSource).length),
              sub: `of ${MODELS.length} models`,
              accent: "text-amber-500",
            },
            {
              label: "Run Locally",
              value: String(MODELS.filter(m => m.canRunLocally).length),
              sub: "via Ollama / llama.cpp",
              accent: "text-purple-500",
            },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/30 bg-card/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">{s.label}</p>
              <p className={`text-lg font-bold truncate ${s.accent}`}>{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted">{s.sub}</p>}
            </div>
          ))}
          {/* Auto-discovered count — only if > 0 */}
          {MODELS.filter(m => m.isAutoDiscovered).length > 0 && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted mb-0.5">Auto-Discovered</p>
              <p className="text-lg font-bold text-violet-500 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                {MODELS.filter(m => m.isAutoDiscovered).length}
              </p>
              <p className="text-[10px] text-muted">new from Arena</p>
            </div>
          )}
        </div>

        {/* ── Global Filters ── */}
        <div className="space-y-3">
          {/* Access + Source filter tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex rounded-xl border border-border/40 overflow-hidden shrink-0">
              {FILTER_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? "bg-violet-500 text-white"
                      : "text-muted hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      tab === t.id ? "bg-white/20" : "bg-muted/20"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search models\u2026"
                className="w-full rounded-xl border border-border/40 bg-card/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted focus:border-violet-500/60 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category tag filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted">
              <Filter className="h-3 w-3" /> Categories:
            </span>
            {TAG_CONFIG.map(t => {
              const active = activeTags.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                    active
                      ? t.color
                      : "border-border/40 text-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <span className="text-[10px] tabular-nums opacity-70">
                    {MODELS.filter(m => m.tags.includes(t.id)).length}
                  </span>
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="text-[10px] text-violet-500 hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Active filter summary */}
          {(tab !== "all" || activeTags.length > 0 || search) && (
            <p className="text-xs text-muted">
              Showing <strong className="text-foreground">{filtered.length}</strong> of {MODELS.length} models
            </p>
          )}
        </div>

        {/* ── View Tabs ── */}
        <div className="flex rounded-xl border border-border/40 overflow-hidden w-fit">
          {(
            [
              { id: "charts", icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Charts" },
              { id: "radar", icon: <Target className="h-3.5 w-3.5" />, label: "Compare" },
              { id: "table", icon: <Table2 className="h-3.5 w-3.5" />, label: "Table" },
            ] as { id: ViewTab; icon: React.ReactNode; label: string }[]
          ).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                view === v.id ? "bg-violet-500 text-white" : "text-muted hover:text-foreground hover:bg-muted/10"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* ════════════════ CHARTS VIEW ════════════════ */}
        {view === "charts" && (
          <div className="space-y-6">
            {/* Benchmark selector pills */}
            <div className="flex gap-2 flex-wrap">
              {BENCHMARK_COLS.map(col => (
                <button
                  key={col.key}
                  onClick={() => setSelectedBench(col.key as BenchKey)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    selectedBench === col.key
                      ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                      : "border-border/40 text-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            {/* Bar chart */}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4 sm:p-6">
              <BenchmarkBarChart benchKey={selectedBench} models={filtered} />
            </div>

            {/* Scatter plot */}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4 sm:p-6">
              <EloVsIndexScatter models={filtered} />
            </div>
          </div>
        )}

        {/* ════════════════ RADAR VIEW ════════════════ */}
        {view === "radar" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-1">Model Comparison Radar</h3>
              <p className="text-xs text-muted mb-4">
                Select models to compare across all 5 benchmarks. Values normalised to 0&ndash;100 relative to the
                dataset.
              </p>

              <RadarCompareChart selectedIds={radarModels} models={filtered} />

              {/* Model selector checkboxes */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-xs font-medium text-muted mb-3">Select models to compare (max 8)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
                  {MODELS.map(m => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={radarModels.includes(m.id)}
                        className="accent-violet-500 w-3.5 h-3.5"
                        onChange={e => {
                          if (e.target.checked && radarModels.length < 8)
                            setRadarModels(p => [...p, m.id]);
                          else if (!e.target.checked) setRadarModels(p => p.filter(id => id !== m.id));
                        }}
                      />
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pc(m.provider) }}
                      />
                      <span className="text-muted truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ TABLE VIEW ════════════════ */}
        {view === "table" && (
          <div className="space-y-4">
            {/* Data table */}
            <div className="rounded-2xl border border-border/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/5">
                      <th
                        onClick={() => handleSort("name")}
                        className="px-3 py-3 text-left text-xs font-semibold text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          Model <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>
                      {BENCHMARK_COLS.map(col => (
                        <th
                          key={col.key}
                          title={col.fullName}
                          onClick={() => handleSort(col.key as BenchKey)}
                          className="px-3 py-3 text-left text-xs font-semibold text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
                        >
                          <span className="flex items-center gap-1">
                            {col.label} <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">
                        Access
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td
                          colSpan={BENCHMARK_COLS.length + 2}
                          className="px-3 py-12 text-center text-muted text-sm"
                        >
                          No models match your filters
                        </td>
                      </tr>
                    ) : (
                      sorted.flatMap(m => {
                        const isExpanded = expanded === m.id;
                        return [
                          <tr
                            key={m.id}
                            onClick={() => setExpanded(isExpanded ? null : m.id)}
                            className={`border-b border-border/20 cursor-pointer transition-colors hover:bg-violet-500/5 ${
                              isExpanded ? "bg-violet-500/8" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-medium block" style={{ color: pc(m.provider) }}>
                                {m.provider}
                              </span>
                              <span className="text-sm font-semibold flex items-center gap-1">
                                {m.isAutoDiscovered && (
                                  <span title="Auto-discovered from Arena" className="inline-flex items-center gap-0.5 text-[8px] font-bold rounded-full px-1.5 py-0.5 bg-violet-500/15 text-violet-500">
                                    <Sparkles className="h-2 w-2" /> NEW
                                  </span>
                                )}
                                {m.name}
                              </span>
                              {m.params && (
                                <span className="text-[10px] text-muted ml-1.5 font-mono">{m.params}</span>
                              )}
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {m.tags.map(t => {
                                  const cfg = TAG_CONFIG.find(tc => tc.id === t);
                                  return cfg ? (
                                    <span key={t} className={`inline-flex items-center gap-0.5 text-[8px] font-medium rounded-full px-1.5 py-0.5 ${cfg.color}`}>
                                      {cfg.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </td>
                            {BENCHMARK_COLS.map(col => {
                              const v = m[col.key as BenchKey];
                              return (
                                <td key={col.key} className={`px-3 py-2.5 ${scoreBg(v, col.key as BenchKey)}`}>
                                  <span
                                    className={`text-sm tabular-nums ${scoreColor(v, col.key as BenchKey)}`}
                                  >
                                    {fmt(v, col.key as BenchKey)}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                {m.isOpenSource && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-fit">
                                    <Cpu className="h-2.5 w-2.5" />
                                    Open
                                  </span>
                                )}
                                {m.canRunLocally && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 w-fit">
                                    <HardDrive className="h-2.5 w-2.5" />
                                    Local
                                  </span>
                                )}
                                {m.isFree && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 w-fit">
                                    <Gift className="h-2.5 w-2.5" />
                                    Free
                                  </span>
                                )}
                                {!m.isFree && !m.isOpenSource && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-muted/20 text-muted w-fit">
                                    <Lock className="h-2.5 w-2.5" />
                                    Paid
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>,
                          ...(isExpanded
                            ? [
                                <tr
                                  key={`${m.id}-exp`}
                                  className="bg-violet-500/5 border-b border-violet-500/20"
                                >
                                  <td colSpan={BENCHMARK_COLS.length + 2} className="px-5 py-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                                      {BENCHMARK_COLS.map(col => {
                                        const v = m[col.key as BenchKey];
                                        return (
                                          <a
                                            key={col.key}
                                            href={col.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="group rounded-lg border border-border/30 bg-background/60 px-3 py-2 hover:border-violet-500/40 transition-all"
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[10px] font-bold text-violet-500 group-hover:underline">
                                                {col.fullName}
                                              </span>
                                              <ExternalLink className="h-2.5 w-2.5 text-muted" />
                                            </div>
                                            <p
                                              className={`text-xl font-bold tabular-nums ${scoreColor(v, col.key as BenchKey)}`}
                                            >
                                              {fmt(v, col.key as BenchKey)}
                                            </p>
                                            <p className="text-[10px] text-muted mt-0.5">{col.source}</p>
                                          </a>
                                        );
                                      })}
                                    </div>
                                    <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
                                      {m.params && (
                                        <span>
                                          <span className="text-foreground font-medium">Params:</span> {m.params}
                                        </span>
                                      )}
                                      <span>
                                        <span className="text-foreground font-medium">Released:</span>{" "}
                                        {m.releasedAt}
                                      </span>
                                      <span>
                                        <span className="text-foreground font-medium">License:</span>{" "}
                                        {m.isOpenSource ? "Open weights" : "Proprietary"}
                                      </span>
                                      <span>
                                        <span className="text-foreground font-medium">Access:</span>{" "}
                                        {m.isFree ? "Free tier available" : "Paid API only"}
                                      </span>
                                      {m.canRunLocally && (
                                        <span className="inline-flex items-center gap-0.5">
                                          <HardDrive className="h-3 w-3 text-purple-500" />
                                          <span className="text-foreground font-medium">Can run locally</span> via Ollama / llama.cpp
                                        </span>
                                      )}
                                      <div className="flex gap-1 mt-1">
                                        {m.tags.map(t => {
                                          const cfg = TAG_CONFIG.find(tc => tc.id === t);
                                          return cfg ? (
                                            <span key={t} className={`inline-flex items-center gap-0.5 text-[9px] font-medium rounded-full px-1.5 py-0.5 ${cfg.color}`}>
                                              {cfg.icon} {cfg.label}
                                            </span>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>,
                              ]
                            : []),
                        ];
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Score Scale ── */}
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <span className="font-medium text-foreground mr-1">Scale:</span>
          {[
            { label: "Top tier", cls: "text-emerald-600 dark:text-emerald-400 font-bold" },
            { label: "Strong", cls: "text-green-600 dark:text-green-400 font-semibold" },
            { label: "Good", cls: "text-lime-600 dark:text-lime-400" },
            { label: "Average", cls: "text-yellow-600 dark:text-yellow-400" },
            { label: "Weak", cls: "text-amber-600 dark:text-amber-400" },
            { label: "Poor", cls: "text-red-500 dark:text-red-400" },
          ].map(s => (
            <span key={s.label} className={s.cls}>
              {s.label}
            </span>
          ))}
          <span className="text-muted ml-1">
            &mdash; Arena ELO normalised to 1250&ndash;1550 &middot; AA Index to 0&ndash;60 for colour
          </span>
        </div>

        {/* ── Benchmark Details ── */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Benchmark Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {BENCHMARK_COLS.map(col => (
              <a
                key={col.key}
                href={col.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border/30 bg-card/50 px-3 py-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-bold text-violet-500 group-hover:underline">{col.fullName}</p>
                  <ExternalLink className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted leading-tight">{col.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ── Sources ── */}
        <div className="rounded-2xl border border-border/30 bg-card/30 px-5 py-4 flex gap-3">
          <Info className="h-4 w-4 text-muted shrink-0 mt-0.5" />
          <div className="text-xs text-muted leading-relaxed space-y-1.5">
            {BENCHMARK_COLS.map(col => (
              <p key={col.key}>
                <strong className="text-foreground">{col.fullName}:</strong> {col.desc}{" "}
                Source:{" "}
                <a
                  href={col.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-500 hover:underline"
                >
                  {col.source}
                </a>
                .
              </p>
            ))}
            <p className="text-muted/70 pt-1">
              &mdash; not officially benchmarked / not publicly reported for that model. Data verified {DATA_DATE}.
              Page auto-refreshes via ISR every 24&nbsp;hours. SWE-bench and Arena scores are agentic/interactive
              and may vary by setup.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
