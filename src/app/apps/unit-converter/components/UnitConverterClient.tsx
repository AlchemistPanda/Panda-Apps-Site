"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowLeftRight, Calculator, Search, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CATEGORIES, convert, formatResult, getUnit } from "../types";
import type { Category, Unit } from "../types";

/* ══════════════════════════════════════════════════════════════
   ACTIVE STATE
══════════════════════════════════════════════════════════════ */
interface State {
  categoryId: string;
  fromUnitId: string;
  toUnitId:   string;
  fromValue:  string;
  toValue:    string;
  lastEdited: "from" | "to";
}

function defaultState(cat: Category): State {
  return {
    categoryId: cat.id,
    fromUnitId: cat.units[0].id,
    toUnitId:   cat.units[1]?.id ?? cat.units[0].id,
    fromValue:  "1",
    toValue:    "",
    lastEdited: "from",
  };
}

function recalc(s: State): State {
  const cat = CATEGORIES.find((c) => c.id === s.categoryId)!;
  const from = cat.units.find((u) => u.id === s.fromUnitId)!;
  const to   = cat.units.find((u) => u.id === s.toUnitId)!;

  if (s.lastEdited === "from") {
    const v = parseFloat(s.fromValue);
    const result = isNaN(v) ? "" : formatResult(convert(v, from, to));
    return { ...s, toValue: result };
  } else {
    const v = parseFloat(s.toValue);
    const result = isNaN(v) ? "" : formatResult(convert(v, to, from));
    return { ...s, fromValue: result };
  }
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function UnitConverterClient() {
  const [state, setState] = useState<State>(() => recalc(defaultState(CATEGORIES[0])));
  const [catSearch, setCatSearch] = useState("");
  const [showAll, setShowAll] = useState(true);

  const update = useCallback((patch: Partial<State>) => {
    setState((prev) => recalc({ ...prev, ...patch }));
  }, []);

  const cat    = CATEGORIES.find((c) => c.id === state.categoryId)!;
  const fromU  = cat.units.find((u) => u.id === state.fromUnitId)!;
  const toU    = cat.units.find((u) => u.id === state.toUnitId)!;

  /* All-units table */
  const allConversions = useMemo(() => {
    const base = state.lastEdited === "from"
      ? parseFloat(state.fromValue)
      : parseFloat(state.toValue);
    const baseUnit = state.lastEdited === "from" ? fromU : toU;
    if (isNaN(base)) return [];
    return cat.units.map((u) => ({
      unit: u,
      value: formatResult(convert(base, baseUnit, u)),
    }));
  }, [cat, fromU, toU, state]);

  const filteredCats = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(catSearch.toLowerCase())
  );

  const swap = () => {
    update({
      fromUnitId: state.toUnitId,
      toUnitId:   state.fromUnitId,
      fromValue:  state.toValue,
      toValue:    state.fromValue,
      lastEdited: "from",
    });
  };

  const selectCategory = (cat: Category) => {
    setState(recalc(defaultState(cat)));
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link href="/#apps" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Back
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Calculator className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">Unit Converter</span>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 text-xs font-medium text-teal-400">
            <Calculator className="h-3 w-3" />
            Unit Converter
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Convert{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              anything
            </span>
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            14 categories, 130+ units — length, weight, temperature, speed, data, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ── Category sidebar ─────────────────────────── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search categories…"
                className="w-full rounded-xl border border-border/40 bg-card/30 pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-teal-500/50 placeholder-muted"
              />
            </div>
            <div className="rounded-2xl border border-border/30 bg-card/20 overflow-hidden">
              {filteredCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/10 last:border-0 ${
                    state.categoryId === c.id
                      ? "bg-teal-500/10 text-teal-300 border-l-2 border-teal-500/60"
                      : "text-muted hover:bg-card/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{c.icon}</span>
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-auto text-[10px] text-muted/60">
                    {c.units.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right panel ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Main converter card */}
            <div className="rounded-2xl border border-border/30 bg-card/20 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
              </div>

              <div className="flex items-center gap-3">
                {/* FROM */}
                <div className="flex-1 space-y-2">
                  <UnitSelect
                    units={cat.units}
                    value={state.fromUnitId}
                    onChange={(id) => update({ fromUnitId: id, lastEdited: "from" })}
                  />
                  <ValueInput
                    value={state.fromValue}
                    placeholder="Enter value"
                    onChange={(v) => update({ fromValue: v, lastEdited: "from" })}
                    symbol={fromU.symbol}
                    accent="teal"
                  />
                </div>

                {/* Swap */}
                <button
                  onClick={swap}
                  title="Swap units"
                  className="flex-shrink-0 rounded-xl border border-border/40 bg-card/40 p-2.5 text-muted hover:text-teal-300 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all mt-8"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>

                {/* TO */}
                <div className="flex-1 space-y-2">
                  <UnitSelect
                    units={cat.units}
                    value={state.toUnitId}
                    onChange={(id) => update({ toUnitId: id, lastEdited: "from" })}
                  />
                  <ValueInput
                    value={state.toValue}
                    placeholder="Result"
                    onChange={(v) => update({ toValue: v, lastEdited: "to" })}
                    symbol={toU.symbol}
                    accent="cyan"
                  />
                </div>
              </div>

              {/* Formula hint */}
              {state.fromValue && state.toValue && (
                <p className="text-[11px] text-muted text-center">
                  <span className="font-mono text-teal-400">{state.fromValue} {fromU.symbol}</span>
                  {" = "}
                  <span className="font-mono text-cyan-400">{state.toValue} {toU.symbol}</span>
                </p>
              )}
            </div>

            {/* All units table */}
            <div className="rounded-2xl border border-border/30 bg-card/20 overflow-hidden">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-card/40 transition-colors"
              >
                <span>All {cat.label} Units</span>
                <span className="text-xs text-muted">{showAll ? "Hide" : `${cat.units.length} units`}</span>
              </button>

              {showAll && allConversions.length > 0 && (
                <div className="divide-y divide-border/10">
                  {allConversions.map(({ unit, value }) => {
                    const isFrom = unit.id === state.fromUnitId;
                    const isTo   = unit.id === state.toUnitId;
                    return (
                      <div
                        key={unit.id}
                        className={`flex items-center gap-4 px-5 py-2.5 transition-colors cursor-pointer hover:bg-card/40 ${
                          isFrom ? "bg-teal-500/5" : isTo ? "bg-cyan-500/5" : ""
                        }`}
                        onClick={() => {
                          if (!isFrom) update({ toUnitId: unit.id, lastEdited: "from" });
                        }}
                      >
                        <span className="w-16 flex-shrink-0 font-mono text-[11px] text-muted">
                          {unit.symbol}
                        </span>
                        <span className={`flex-1 text-sm font-medium ${
                          isFrom ? "text-teal-300" : isTo ? "text-cyan-300" : "text-foreground"
                        }`}>
                          {value}
                        </span>
                        <span className="text-xs text-muted truncate max-w-[120px]">
                          {unit.label}
                          {isFrom && <span className="ml-1 text-teal-500/80">(from)</span>}
                          {isTo   && <span className="ml-1 text-cyan-500/80">(to)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {showAll && allConversions.length === 0 && (
                <p className="text-center text-sm text-muted py-6">Enter a value above to see all conversions.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function UnitSelect({
  units,
  value,
  onChange,
}: {
  units: Unit[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border/40 bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-teal-500/50 cursor-pointer"
    >
      {units.map((u) => (
        <option key={u.id} value={u.id} className="bg-zinc-900">
          {u.label} ({u.symbol})
        </option>
      ))}
    </select>
  );
}

function ValueInput({
  value,
  placeholder,
  onChange,
  symbol,
  accent,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  symbol: string;
  accent: "teal" | "cyan";
}) {
  const ring = accent === "teal"
    ? "focus:border-teal-500/50 focus:ring-teal-500/10"
    : "focus:border-cyan-500/50 focus:ring-cyan-500/10";
  const symColor = accent === "teal" ? "text-teal-400" : "text-cyan-400";

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border/40 bg-card/30 px-3 py-3 pr-14 text-base font-mono text-foreground focus:outline-none focus:ring-1 ${ring} placeholder-muted/50`}
      />
      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${symColor} pointer-events-none`}>
        {symbol}
      </span>
    </div>
  );
}
