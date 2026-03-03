"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Copy, Check, Download, GitCompare,
  Trash2, Eye, Columns2, List,
  HelpCircle, Shuffle, X, ChevronLeft,
} from "lucide-react";
import {
  computeDiff, DEFAULT_OPTIONS,
  type DiffOptions, type DiffRow, type DiffPart,
  type CompareMode, type ViewMode,
} from "../diff-engine";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
const VIEW_MODES: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "split",   label: "Split",   icon: Columns2 },
  { id: "unified", label: "Unified", icon: List     },
  { id: "changes", label: "Changes", icon: Eye      },
];

const COMPARE_MODES: { id: CompareMode; label: string }[] = [
  { id: "line", label: "Line"      },
  { id: "word", label: "Word"      },
  { id: "char", label: "Character" },
];

/* ══════════════════════════════════════════════════════════════
   ROW COLORS
══════════════════════════════════════════════════════════════ */
const ROW_BG = {
  added_right:    "bg-green-950/70",
  removed_left:   "bg-red-950/70",
  modified_left:  "bg-red-950/50",
  modified_right: "bg-blue-950/50",
  empty:          "bg-[#0c0c0f]",
};

/* ══════════════════════════════════════════════════════════════
   INLINE HELPERS
══════════════════════════════════════════════════════════════ */
function Parts({ parts, side }: { parts?: DiffPart[]; side: "left" | "right" }) {
  if (!parts) return null;
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={p.type === "unchanged" ? "" : side === "left"
            ? "bg-red-500/45 rounded-sm"
            : "bg-emerald-500/45 rounded-sm"
          }
        >
          {p.text}
        </span>
      ))}
    </>
  );
}

function LineNum({ n }: { n: number | null }) {
  return (
    <span className="inline-block w-10 flex-shrink-0 select-none text-right pr-3 text-[11px] text-zinc-600 font-mono border-r border-white/5 mr-3">
      {n ?? ""}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function TextDiffClient() {
  const [leftText,   setLeftText]   = useState("");
  const [rightText,  setRightText]  = useState("");
  const [options,    setOptions]    = useState<DiffOptions>(DEFAULT_OPTIONS);
  const [viewMode,   setViewMode]   = useState<ViewMode>("changes");
  const [diffResult, setDiffResult] = useState(() => computeDiff("", "", DEFAULT_OPTIONS));
  const [copied,     setCopied]     = useState<"patch" | "left" | "right" | null>(null);
  const [showHelp,   setShowHelp]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDiffResult(computeDiff(leftText, rightText, options));
    }, 240);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [leftText, rightText, options]);

  const updateOpt = (patch: Partial<DiffOptions>) => setOptions((p) => ({ ...p, ...patch }));
  const swap  = () => { setLeftText(rightText); setRightText(leftText); };
  const clear = () => { setLeftText(""); setRightText(""); };

  const copy = async (what: "patch" | "left" | "right") => {
    const text = what === "patch" ? diffResult.unifiedPatch : what === "left" ? leftText : rightText;
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };

  const downloadPatch = () => {
    const blob = new Blob([diffResult.unifiedPatch], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diff.patch";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const { rows, stats, isIdentical, orderVariant } = diffResult;
  const visibleRows = viewMode === "changes" ? filterWithContext(rows, options.contextLines) : rows;
  const isEmpty = !leftText && !rightText;

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* ── TOOLBAR ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-sm px-4 py-2.5">
        <div className="mx-auto max-w-[1440px] flex items-center gap-2 flex-wrap">

          <Link href="/#apps" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors mr-2 shrink-0 text-sm">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2 mr-1">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <GitCompare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white hidden sm:block">Text Diff</span>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === id
                    ? "bg-violet-500/25 text-violet-300 border border-violet-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Compare granularity */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {COMPARE_MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => updateOpt({ compareMode: id })}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  options.compareMode === id
                    ? "bg-violet-500/25 text-violet-300 border border-violet-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-1">
            <ToggleBtn active={options.ignoreWhitespace} onClick={() => updateOpt({ ignoreWhitespace: !options.ignoreWhitespace })} label="±Spaces" title="Ignore whitespace" />
            <ToggleBtn active={options.ignoreCase}       onClick={() => updateOpt({ ignoreCase: !options.ignoreCase })}             label="Aa"      title="Ignore case" />
            <ToggleBtn active={options.orderIndependent} onClick={() => updateOpt({ orderIndependent: !options.orderIndependent })} label="⇅ Order" title="Order-independent compare" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <TBtn onClick={() => setShowHelp(true)} title="How to use this tool">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Help</span>
            </TBtn>
            <TBtn onClick={swap} title="Swap Text A and Text B">
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Swap</span>
            </TBtn>
            <TBtn onClick={clear} title="Clear both panels">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </TBtn>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <TBtn onClick={() => copy("patch")} title="Copy unified diff patch">
              {copied === "patch" ? <Check className="h-3.5 w-3.5 text-violet-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Copy Patch</span>
            </TBtn>
            <TBtn onClick={downloadPatch} title="Download as .patch file">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">.patch</span>
            </TBtn>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] flex-1 flex flex-col">

        {/* ── INPUT PANELS ──────────────────────────────── */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.07] border-b border-white/[0.07]">
          <InputPane
            label="Text A"
            sublabel="original / before"
            accentColor="red"
            value={leftText}
            onChange={setLeftText}
            onCopy={() => copy("left")}
            copied={copied === "left"}
            placeholder="Paste your original / before text here…"
          />
          <InputPane
            label="Text B"
            sublabel="modified / after"
            accentColor="emerald"
            value={rightText}
            onChange={setRightText}
            onCopy={() => copy("right")}
            copied={copied === "right"}
            placeholder="Paste your modified / after text here…"
          />
        </div>

        {/* ── STATS BAR ─────────────────────────────────── */}
        {!isEmpty && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-white/[0.06] bg-white/[0.015] text-xs">
            {isIdentical ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="h-3.5 w-3.5" /> Identical
              </span>
            ) : orderVariant ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Shuffle className="h-3.5 w-3.5" /> Same content, different order
              </span>
            ) : null}
            <StatPill color="text-emerald-400" value={stats.added}     symbol="+" label="added"     />
            <StatPill color="text-red-400"     value={stats.removed}   symbol="−" label="removed"   />
            <StatPill color="text-blue-400"    value={stats.modified}  symbol="~" label="modified"  />
            <StatPill color="text-zinc-500"    value={stats.unchanged} symbol="=" label="unchanged" />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-zinc-500">Similarity</span>
              <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.similarity >= 80 ? "bg-emerald-500"
                    : stats.similarity >= 50 ? "bg-amber-500"
                    : "bg-red-500"
                  }`}
                  style={{ width: `${stats.similarity}%` }}
                />
              </div>
              <span className={`font-semibold tabular-nums ${
                stats.similarity >= 80 ? "text-emerald-400"
                : stats.similarity >= 50 ? "text-amber-400"
                : "text-red-400"
              }`}>
                {stats.similarity}%
              </span>
            </div>
            {viewMode === "changes" && (
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                <span className="text-zinc-500">Context:</span>
                {[0, 1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateOpt({ contextLines: n })}
                    className={`w-6 h-5 rounded text-[10px] font-bold transition-all ${
                      options.contextLines === n
                        ? "bg-violet-500/25 text-violet-300"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DIFF OUTPUT ───────────────────────────────── */}
        {isEmpty ? (
          <EmptyState onHelp={() => setShowHelp(true)} />
        ) : isIdentical && !orderVariant ? (
          <IdenticalState />
        ) : (
          <div className="overflow-auto font-mono text-[13px] leading-6 flex-1">
            {viewMode === "split"
              ? <SplitView rows={visibleRows} />
              : <UnifiedView rows={visibleRows} viewMode={viewMode} />
            }
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SPLIT VIEW  (column names: A — Before / B — After)
══════════════════════════════════════════════════════════════ */
function SplitView({ rows }: { rows: Array<DiffRow | "separator"> }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-white/[0.05] min-w-[600px]">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400/60 bg-red-950/25 border-b border-white/[0.05]">
        A — Before
      </div>
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 bg-emerald-950/25 border-b border-white/[0.05]">
        B — After
      </div>

      {rows.map((row, i) => {
        if (row === "separator") {
          return (
            <React.Fragment key={`sep-${i}`}>
              <div className="flex items-center px-4 py-1 bg-violet-950/20 border-y border-violet-500/15">
                <span className="text-[10px] text-violet-400/50 select-none">···</span>
              </div>
              <div className="flex items-center px-4 py-1 bg-violet-950/20 border-y border-violet-500/15">
                <span className="text-[10px] text-violet-400/50 select-none">···</span>
              </div>
            </React.Fragment>
          );
        }

        const leftBg =
          row.type === "added"    ? ROW_BG.empty :
          row.type === "removed"  ? ROW_BG.removed_left :
          row.type === "modified" ? ROW_BG.modified_left : "";

        const rightBg =
          row.type === "removed"  ? ROW_BG.empty :
          row.type === "added"    ? ROW_BG.added_right :
          row.type === "modified" ? ROW_BG.modified_right : "";

        return (
          <React.Fragment key={i}>
            <div className={`flex items-start px-2 py-0.5 min-h-[24px] ${leftBg}`}>
              <LineNum n={row.leftNum} />
              <span className={`whitespace-pre-wrap break-all flex-1 ${
                row.type === "removed"  ? "text-red-200" :
                row.type === "modified" ? "text-red-100/90" : "text-zinc-300"
              }`}>
                {row.type === "added" ? null :
                 row.type === "modified" && row.leftParts
                   ? <Parts parts={row.leftParts} side="left" />
                   : row.leftText}
              </span>
              {row.type === "removed"  && <span className="flex-shrink-0 ml-1 text-red-500/50 text-[10px] select-none">−</span>}
              {row.type === "modified" && <span className="flex-shrink-0 ml-1 text-red-500/50 text-[10px] select-none">~</span>}
            </div>

            <div className={`flex items-start px-2 py-0.5 min-h-[24px] ${rightBg}`}>
              <LineNum n={row.rightNum} />
              <span className={`whitespace-pre-wrap break-all flex-1 ${
                row.type === "added"    ? "text-emerald-200" :
                row.type === "modified" ? "text-blue-100/90" : "text-zinc-300"
              }`}>
                {row.type === "removed" ? null :
                 row.type === "modified" && row.rightParts
                   ? <Parts parts={row.rightParts} side="right" />
                   : row.rightText}
              </span>
              {row.type === "added"    && <span className="flex-shrink-0 ml-1 text-emerald-500/50 text-[10px] select-none">+</span>}
              {row.type === "modified" && <span className="flex-shrink-0 ml-1 text-blue-500/50 text-[10px] select-none">~</span>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UNIFIED / CHANGES VIEW
══════════════════════════════════════════════════════════════ */
function UnifiedView({ rows, viewMode }: { rows: Array<DiffRow | "separator">; viewMode: ViewMode }) {
  return (
    <div className="min-w-[400px]">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400/60 bg-violet-950/25 border-b border-white/[0.05]">
        {viewMode === "changes" ? "Changes Only" : "Unified Diff"}
      </div>

      {rows.map((row, i) => {
        if (row === "separator") {
          return (
            <div key={i} className="flex items-center px-4 py-1 bg-violet-950/20 border-y border-violet-500/15">
              <span className="text-[10px] text-violet-400/50 select-none">···</span>
            </div>
          );
        }

        if (row.type === "modified") {
          return (
            <React.Fragment key={i}>
              <div className="flex items-start px-2 py-0.5 bg-red-950/60">
                <span className="w-5 flex-shrink-0 font-bold select-none text-red-500">−</span>
                <LineNum n={row.leftNum} />
                <span className="whitespace-pre-wrap break-all flex-1 text-red-200">
                  {row.leftParts ? <Parts parts={row.leftParts} side="left" /> : row.leftText}
                </span>
              </div>
              <div className="flex items-start px-2 py-0.5 bg-emerald-950/60">
                <span className="w-5 flex-shrink-0 font-bold select-none text-emerald-500">+</span>
                <LineNum n={row.rightNum} />
                <span className="whitespace-pre-wrap break-all flex-1 text-emerald-200">
                  {row.rightParts ? <Parts parts={row.rightParts} side="right" /> : row.rightText}
                </span>
              </div>
            </React.Fragment>
          );
        }

        const prefix      = row.type === "added" ? "+" : row.type === "removed" ? "−" : " ";
        const bg          = row.type === "added" ? "bg-green-950/70" : row.type === "removed" ? "bg-red-950/70" : "";
        const textColor   = row.type === "added" ? "text-emerald-200" : row.type === "removed" ? "text-red-200" : "text-zinc-400";
        const prefixColor = row.type === "added" ? "text-emerald-500" : row.type === "removed" ? "text-red-500" : "text-zinc-700";

        return (
          <div key={i} className={`flex items-start px-2 py-0.5 min-h-[24px] ${bg}`}>
            <span className={`w-5 flex-shrink-0 font-bold select-none ${prefixColor}`}>{prefix}</span>
            <LineNum n={row.type === "added" ? row.rightNum : row.leftNum} />
            <span className={`whitespace-pre-wrap break-all flex-1 ${textColor}`}>
              {row.type === "added" ? row.rightText : row.leftText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONTEXT FILTER
══════════════════════════════════════════════════════════════ */
function filterWithContext(rows: DiffRow[], context: number): Array<DiffRow | "separator"> {
  if (rows.length === 0) return [];
  const changed = new Set<number>();
  rows.forEach((r, i) => {
    if (r.type !== "unchanged") {
      for (let j = Math.max(0, i - context); j <= Math.min(rows.length - 1, i + context); j++) {
        changed.add(j);
      }
    }
  });
  const result: Array<DiffRow | "separator"> = [];
  let lastIncluded = -1;
  rows.forEach((r, i) => {
    if (changed.has(i)) {
      if (lastIncluded >= 0 && i > lastIncluded + 1) result.push("separator");
      result.push(r);
      lastIncluded = i;
    }
  });
  return result;
}

/* ══════════════════════════════════════════════════════════════
   INPUT PANE — bordered box with accent glow
══════════════════════════════════════════════════════════════ */
type AccentColor = "red" | "emerald";

const ACCENT: Record<AccentColor, {
  badge: string; border: string; focusBorder: string; headerBg: string; headerBorder: string;
}> = {
  red: {
    badge:       "text-red-400",
    border:      "border-red-500/25",
    focusBorder: "focus-within:border-red-500/55",
    headerBg:    "bg-red-950/20",
    headerBorder:"border-red-500/20",
  },
  emerald: {
    badge:       "text-emerald-400",
    border:      "border-emerald-500/25",
    focusBorder: "focus-within:border-emerald-500/55",
    headerBg:    "bg-emerald-950/20",
    headerBorder:"border-emerald-500/20",
  },
};

function InputPane({
  label, sublabel, accentColor, value, onChange, onCopy, copied, placeholder,
}: {
  label: string;
  sublabel: string;
  accentColor: AccentColor;
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  copied: boolean;
  placeholder: string;
}) {
  const a = ACCENT[accentColor];
  const lines = value ? value.split("\n").length : 0;

  return (
    <div className={`flex flex-col min-h-[200px] border-2 ${a.border} ${a.focusBorder} m-3 rounded-xl overflow-hidden transition-colors bg-[#0d0d10]`}>
      <div className={`flex items-center justify-between px-3 py-2 ${a.headerBg} border-b ${a.headerBorder}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-wide ${a.badge}`}>{label}</span>
          <span className="text-[10px] text-zinc-600">{sublabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {lines > 0 && (
            <span className="text-[10px] text-zinc-600 tabular-nums">{lines} line{lines !== 1 ? "s" : ""}</span>
          )}
          <button onClick={onCopy} className="text-zinc-600 hover:text-white transition-colors" title={`Copy ${label}`}>
            {copied ? <Check className="h-3.5 w-3.5 text-violet-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 min-h-[160px] resize-y bg-transparent p-3 font-mono text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none leading-6"
        style={{ tabSize: 2 }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SMALL UI HELPERS
══════════════════════════════════════════════════════════════ */
function ToggleBtn({ active, onClick, label, title }: {
  active: boolean; onClick: () => void; label: string; title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
        active
          ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      {label}
    </button>
  );
}

function TBtn({ onClick, title, children }: {
  onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/30 transition-all"
    >
      {children}
    </button>
  );
}

function StatPill({ color, value, symbol, label }: {
  color: string; value: number; symbol: string; label: string;
}) {
  if (value === 0) return null;
  return (
    <span className={`flex items-center gap-1 font-semibold tabular-nums ${color}`}>
      <span>{symbol}</span>
      <span>{value}</span>
      <span className="font-normal text-zinc-600">{label}</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
function EmptyState({ onHelp }: { onHelp: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-20 text-center px-4">
      <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <GitCompare className="h-6 w-6 text-violet-400" />
      </div>
      <div>
        <p className="text-white font-semibold mb-1">Paste text into Text A and Text B to compare</p>
        <p className="text-zinc-500 text-sm">Supports code, prose, JSON, YAML, CSV — any text-based content.</p>
      </div>
      <button
        onClick={onHelp}
        className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition-all"
      >
        <HelpCircle className="h-4 w-4" />
        How does it work?
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   IDENTICAL STATE
══════════════════════════════════════════════════════════════ */
function IdenticalState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <Check className="h-5 w-5 text-emerald-400" />
      </div>
      <p className="text-emerald-400 font-semibold text-lg">Texts are identical</p>
      <p className="text-zinc-500 text-sm">No differences found with the current comparison settings.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HELP MODAL
══════════════════════════════════════════════════════════════ */
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111114] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#111114]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Text Diff — How to use</p>
              <p className="text-[11px] text-zinc-500">Everything you need to know</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-6">

          <HSection title="Basic usage">
            <Steps steps={[
              { num: "1", text: "Paste your original / before text into Text A (left panel — red border)" },
              { num: "2", text: "Paste your modified / after text into Text B (right panel — green border)" },
              { num: "3", text: "The diff updates automatically as you type, no button needed" },
            ]} />
          </HSection>

          <HSection title="View modes">
            <HRow icon="⊟" label="Split"   desc="Side-by-side columns — A (before) on the left, B (after) on the right. Best for most comparisons." />
            <HRow icon="≡" label="Unified" desc="Both sides in one column with + / − prefixes, like a classic git diff output." />
            <HRow icon="◎" label="Changes" desc="Only the changed lines, skipping unchanged ones. Use 'Context' to show surrounding lines." />
          </HSection>

          <HSection title="Compare granularity">
            <HRow icon="▤" label="Line"      desc="Compares line-by-line. Within modified lines, changed words are highlighted. Best default." />
            <HRow icon="W" label="Word"      desc="Word-by-word tokenised diff. Good for prose and natural language text." />
            <HRow icon="C" label="Character" desc="Character-level granularity. Useful for JSON, configs, or short values." />
          </HSection>

          <HSection title="Toggle options">
            <HRow icon="±"  label="Spaces" desc="Ignore whitespace — tabs, extra spaces, and trailing whitespace are treated as equal." />
            <HRow icon="Aa" label="Case"   desc="Ignore upper/lower-case — 'Hello' and 'hello' are treated as the same." />
            <HRow icon="⇅"  label="Order"  desc="Sort both texts line-by-line before comparing. Detects the same content in a different order." />
          </HSection>

          <HSection title="Colour legend">
            <div className="grid grid-cols-2 gap-2">
              <CRow bg="bg-red-950/70"   text="text-red-300"     label="Removed — only in A" />
              <CRow bg="bg-green-950/70" text="text-emerald-300" label="Added — only in B" />
              <CRow bg="bg-red-950/50"   text="text-red-200"     label="Modified line — before" />
              <CRow bg="bg-blue-950/50"  text="text-blue-200"    label="Modified line — after" />
            </div>
            <p className="text-[11px] text-zinc-600 mt-2">
              Within modified lines, the exact changed words or characters are highlighted with a stronger background.
            </p>
          </HSection>

          <HSection title="Export">
            <HRow icon="⎘" label="Copy Patch" desc="Copies a standard unified diff to clipboard — works with git apply, patch, and most IDEs." />
            <HRow icon="↓" label=".patch"     desc="Downloads the same unified diff as a file named diff.patch." />
          </HSection>

        </div>
      </div>
    </div>
  );
}

/* ── Help modal sub-components ─────────────────────────── */
function HSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 mb-2.5">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Steps({ steps }: { steps: { num: string; text: string }[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.num} className="flex items-start gap-3">
          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold flex items-center justify-center">
            {s.num}
          </span>
          <p className="text-sm text-zinc-300">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

function HRow({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <span className="flex-shrink-0 h-6 w-6 rounded-md bg-violet-500/15 text-violet-300 text-[11px] font-bold flex items-center justify-center">
        {icon}
      </span>
      <div>
        <span className="text-sm font-semibold text-white">{label} </span>
        <span className="text-sm text-zinc-400">— {desc}</span>
      </div>
    </div>
  );
}

function CRow({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${bg}`}>
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  );
}
