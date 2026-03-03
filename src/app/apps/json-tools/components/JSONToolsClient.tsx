"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Copy, Check, AlertCircle, ChevronRight,
  ChevronDown, MousePointerClick, FlaskConical, AlignLeft,
  Braces, RotateCcw, ArrowRightLeft, Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   JSONPath Evaluator
═══════════════════════════════════════════════════════════════ */

type PathResult = { path: string; value: unknown };

function evalFilter(expr: string, item: unknown): boolean {
  if (!expr.startsWith("@")) return false;
  const m = expr.match(/^@\.([A-Za-z_$][A-Za-z0-9_$]*)\s*(===?|!==?|>=|<=|>|<)\s*(.+)$/);
  if (m) {
    const [, key, op, rawVal] = m;
    const obj = typeof item === "object" && item !== null && !Array.isArray(item)
      ? (item as Record<string, unknown>) : null;
    const itemVal = obj ? obj[key] : undefined;
    let val: unknown;
    if (rawVal === "true") val = true;
    else if (rawVal === "false") val = false;
    else if (rawVal === "null") val = null;
    else if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
      val = rawVal.slice(1, -1);
    } else { const n = parseFloat(rawVal); val = isNaN(n) ? rawVal : n; }
    switch (op) {
      case "==": case "===": return itemVal === val;
      case "!=": case "!==": return itemVal !== val;
      case ">":  return typeof itemVal === "number" && typeof val === "number" && itemVal > val;
      case ">=": return typeof itemVal === "number" && typeof val === "number" && itemVal >= val;
      case "<":  return typeof itemVal === "number" && typeof val === "number" && itemVal < val;
      case "<=": return typeof itemVal === "number" && typeof val === "number" && itemVal <= val;
    }
  }
  // Existence: @.key
  const ex = expr.match(/^@\.([A-Za-z_$][A-Za-z0-9_$]*)$/);
  if (ex) {
    const key = ex[1];
    return typeof item === "object" && item !== null && key in (item as Record<string, unknown>);
  }
  return false;
}

function findClose(s: string): number {
  let depth = 0, inS = false, inD = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (!inS && !inD) {
      if (c === "[") depth++;
      else if (c === "]" && --depth === 0) return i;
    }
  }
  return -1;
}

function evalJsonPath(data: unknown, expr: string): PathResult[] {
  if (!expr?.trim().startsWith("$")) return [];
  const results: PathResult[] = [];

  const exec = (cur: unknown, rem: string, rp: string): void => {
    if (rem === "") { results.push({ path: rp, value: cur }); return; }

    // Recursive descent ..
    if (rem.startsWith("..")) {
      const after = rem.slice(2);
      const km = after.match(/^(\*|[A-Za-z_$][A-Za-z0-9_$]*)/);
      const key = km ? km[1] : "";
      const rest = km ? after.slice(key.length) : "";
      const scan = (node: unknown, np: string): void => {
        if (key === "*") {
          if (Array.isArray(node)) node.forEach((v, i) => { exec(v, rest, `${np}[${i}]`); scan(v, `${np}[${i}]`); });
          else if (typeof node === "object" && node !== null)
            for (const [k, v] of Object.entries(node)) { exec(v, rest, `${np}['${k}']`); scan(v, `${np}['${k}']`); }
        } else if (key) {
          if (!Array.isArray(node) && typeof node === "object" && node !== null) {
            const rec = node as Record<string, unknown>;
            if (key in rec) exec(rec[key], rest, `${np}['${key}']`);
            for (const [, v] of Object.entries(rec)) scan(v, np);
          } else if (Array.isArray(node)) node.forEach((v, i) => scan(v, `${np}[${i}]`));
        } else {
          exec(node, rest, np);
          if (Array.isArray(node)) node.forEach((v, i) => scan(v, `${np}[${i}]`));
          else if (typeof node === "object" && node !== null)
            for (const [k, v] of Object.entries(node)) scan(v, `${np}['${k}']`);
        }
      };
      if (!key && after === "") exec(cur, "", rp);
      scan(cur, rp);
      return;
    }

    // Dot child .key or .*
    if (rem.startsWith(".")) {
      const r = rem.slice(1);
      if (r.startsWith("*")) {
        const a = r.slice(1);
        if (Array.isArray(cur)) cur.forEach((v, i) => exec(v, a, `${rp}[${i}]`));
        else if (typeof cur === "object" && cur !== null)
          for (const [k, v] of Object.entries(cur)) exec(v, a, `${rp}.${k}`);
        return;
      }
      const km = r.match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (!km) return;
      const key = km[1]; const a = r.slice(key.length);
      if (!Array.isArray(cur) && typeof cur === "object" && cur !== null) {
        const rec = cur as Record<string, unknown>;
        if (key in rec) exec(rec[key], a, `${rp}.${key}`);
      }
      return;
    }

    // Subscript [...]
    if (rem.startsWith("[")) {
      const ci = findClose(rem);
      if (ci === -1) return;
      const inner = rem.slice(1, ci).trim();
      const a = rem.slice(ci + 1);

      // Quoted key
      if ((inner.startsWith("'") && inner.endsWith("'")) || (inner.startsWith('"') && inner.endsWith('"'))) {
        const key = inner.slice(1, -1);
        if (!Array.isArray(cur) && typeof cur === "object" && cur !== null) {
          const rec = cur as Record<string, unknown>;
          if (key in rec) exec(rec[key], a, `${rp}['${key}']`);
        }
        return;
      }

      // Wildcard
      if (inner === "*") {
        if (Array.isArray(cur)) cur.forEach((v, i) => exec(v, a, `${rp}[${i}]`));
        else if (typeof cur === "object" && cur !== null)
          for (const [k, v] of Object.entries(cur)) exec(v, a, `${rp}['${k}']`);
        return;
      }

      // Filter [?(...)]
      if (inner.startsWith("?(") && inner.endsWith(")")) {
        const fe = inner.slice(2, -1).trim();
        const items: [unknown, string][] = Array.isArray(cur)
          ? cur.map((v, i) => [v, `${rp}[${i}]`])
          : typeof cur === "object" && cur !== null
            ? Object.entries(cur as Record<string, unknown>).map(([k, v]) => [v, `${rp}['${k}']`])
            : [];
        for (const [v, p] of items) if (evalFilter(fe, v)) exec(v, a, p);
        return;
      }

      // Slice start:end:step
      if (inner.includes(":")) {
        if (!Array.isArray(cur)) return;
        const parts = inner.split(":").map(s => s.trim());
        const len = cur.length;
        const ri = (s: string, d: number) => { if (!s) return d; const n = parseInt(s); return isNaN(n) ? d : n < 0 ? len + n : n; };
        const s = ri(parts[0], 0), e = ri(parts[1], len), st = ri(parts[2], 1);
        if (st > 0) for (let i = s; i < e && i < len; i += st) exec(cur[i], a, `${rp}[${i}]`);
        return;
      }

      // Union 0,1,'key'
      if (inner.includes(",")) {
        for (const t of inner.split(",").map(s => s.trim())) {
          const qi = (t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'));
          if (qi) {
            const k = t.slice(1, -1);
            if (!Array.isArray(cur) && typeof cur === "object" && cur !== null) {
              const rec = cur as Record<string, unknown>;
              if (k in rec) exec(rec[k], a, `${rp}['${k}']`);
            }
          } else {
            const n = parseInt(t);
            if (!isNaN(n) && Array.isArray(cur)) {
              const idx = n < 0 ? cur.length + n : n;
              if (idx >= 0 && idx < cur.length) exec(cur[idx], a, `${rp}[${idx}]`);
            }
          }
        }
        return;
      }

      // Single index
      const n = parseInt(inner);
      if (!isNaN(n) && Array.isArray(cur)) {
        const idx = n < 0 ? cur.length + n : n;
        if (idx >= 0 && idx < cur.length) exec(cur[idx], a, `${rp}[${idx}]`);
      }
    }
  };

  exec(data, expr.trim().slice(1), "$");
  return results;
}

/* ═══════════════════════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════════════════════ */

const DEFAULT_JSON = `{
  "store": {
    "name": "Panda Books",
    "founded": 2020,
    "active": true,
    "address": {
      "street": "42 Bamboo Lane",
      "city": "Mumbai",
      "country": "India"
    },
    "books": [
      {
        "id": 1,
        "title": "The Pragmatic Programmer",
        "author": "David Thomas",
        "price": 45.99,
        "inStock": true,
        "tags": ["programming", "best-practice"]
      },
      {
        "id": 2,
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "price": 39.99,
        "inStock": false,
        "tags": ["programming", "refactoring"]
      },
      {
        "id": 3,
        "title": "You Don't Know JS",
        "author": "Kyle Simpson",
        "price": 29.99,
        "inStock": true,
        "tags": ["javascript", "advanced"]
      }
    ],
    "manager": null,
    "contact": {
      "email": "hello@pandabooks.in",
      "phone": "+91-22-1234-5678"
    }
  },
  "lastUpdated": "2026-03-04",
  "version": 3
}`;

const EXAMPLE_PATHS = [
  { label: "Root", path: "$", desc: "Everything" },
  { label: "Store name", path: "$.store.name", desc: "String property" },
  { label: "All books", path: "$.store.books[*]", desc: "Array wildcard" },
  { label: "First book", path: "$.store.books[0]", desc: "Array index" },
  { label: "Last book", path: "$.store.books[-1]", desc: "Negative index" },
  { label: "All titles", path: "$.store.books[*].title", desc: "Nested property" },
  { label: "All authors", path: "$..author", desc: "Recursive descent" },
  { label: "In-stock books", path: "$.store.books[?(@.inStock == true)]", desc: "Filter expression" },
  { label: "Cheap books", path: "$.store.books[?(@.price < 40)]", desc: "Numeric compare" },
  { label: "Books 0-1", path: "$.store.books[0:2]", desc: "Array slice" },
];

/* ═══════════════════════════════════════════════════════════════
   JSON Tree
═══════════════════════════════════════════════════════════════ */

type TreeProps = {
  name: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  collapsed: Set<string>;
  onToggle: (p: string) => void;
  selectedPath: string;
  onSelect: (path: string) => void;
};

function typeColor(v: unknown) {
  if (typeof v === "string") return "text-emerald-400";
  if (typeof v === "number") return "text-cyan-400";
  if (typeof v === "boolean") return "text-amber-400";
  if (v === null) return "text-muted/60";
  return "text-foreground";
}

function typeLabel(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return `array[${(v as unknown[]).length}]`;
  return typeof v;
}

function InlinePreview({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <span className="text-muted/40 text-[10px]">[{value.length}]</span>;
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value as object);
    const preview = keys.slice(0, 2).join(", ") + (keys.length > 2 ? "…" : "");
    return <span className="text-muted/40 text-[10px]">{"{"}{preview}{"}"}</span>;
  }
  return null;
}

function JsonTreeNode({ name, value, path, depth, collapsed, onToggle, selectedPath, onSelect }: TreeProps) {
  const isSelected = selectedPath === path;
  const isCollapsed = collapsed.has(path);
  const isComplex = typeof value === "object" && value !== null;
  const isArr = Array.isArray(value);

  const indent = depth * 14;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(path);
  };

  const nameEl = name !== null ? (
    <span
      onClick={handleSelect}
      title={`Path: ${path}`}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${isSelected ? "underline decoration-violet-400" : ""}`}
    >
      {typeof name === "number"
        ? <span className="text-muted/50 text-[11px]">{name}:</span>
        : <span className="text-violet-300/90 text-[11px]">"{name}"<span className="text-muted/60">:</span></span>
      }
    </span>
  ) : null;

  if (!isComplex) {
    const disp = value === null ? "null" : typeof value === "string" ? `"${value}"` : String(value);
    return (
      <div
        className={`flex items-baseline gap-1.5 py-0.5 px-1 rounded hover:bg-white/5 transition-colors group ${isSelected ? "bg-violet-500/15 rounded" : ""}`}
        style={{ paddingLeft: indent + 4 }}
      >
        {nameEl && <>{nameEl}{" "}</>}
        <span
          onClick={handleSelect}
          title={`${path}\n${typeLabel(value)}: ${disp}`}
          className={`font-mono text-[11px] cursor-pointer hover:opacity-80 transition-opacity ${typeColor(value)}`}
        >
          {disp}
        </span>
        {isSelected && (
          <span className="ml-auto text-[9px] text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            ✓ selected
          </span>
        )}
      </div>
    );
  }

  const entries = isArr
    ? (value as unknown[]).map((v, i) => ({ key: i, val: v, childPath: `${path}[${i}]` }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ key: k, val: v, childPath: `${path}.${k}` }));

  const open = !isCollapsed;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded hover:bg-white/5 transition-colors cursor-pointer group ${isSelected ? "bg-violet-500/15" : ""}`}
        style={{ paddingLeft: indent + 4 }}
        onClick={handleSelect}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggle(path); }}
          className="text-muted/50 hover:text-muted shrink-0 -ml-1 p-0.5"
        >
          {open ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        </button>
        {nameEl && <>{nameEl}{" "}</>}
        <span className="text-muted/50 font-mono text-[11px]">{isArr ? "[" : "{"}</span>
        {!open && (
          <>
            <InlinePreview value={value} />
            <span className="text-muted/50 font-mono text-[11px]">{isArr ? "]" : "}"}</span>
          </>
        )}
        {isSelected && (
          <span className="ml-1 text-[9px] text-violet-400 opacity-0 group-hover:opacity-100 shrink-0">✓</span>
        )}
      </div>

      {open && (
        <>
          {entries.map(({ key, val, childPath }) => (
            <JsonTreeNode
              key={String(key)}
              name={key}
              value={val}
              path={childPath}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
          <div className="text-muted/50 font-mono text-[11px]" style={{ paddingLeft: indent + 4 }}>
            {isArr ? "]" : "}"}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Value preview for selected path
═══════════════════════════════════════════════════════════════ */

function ValuePreview({ value }: { value: unknown }) {
  if (typeof value === "string") return <span className="text-emerald-400">"{value}"</span>;
  if (typeof value === "number" || typeof value === "boolean") return <span className={typeColor(value)}>{String(value)}</span>;
  if (value === null) return <span className="text-muted/60">null</span>;
  const s = JSON.stringify(value, null, 2);
  return (
    <pre className="text-xs font-mono text-foreground/80 overflow-auto max-h-28 text-[11px] leading-relaxed">
      {s.length > 400 ? s.slice(0, 400) + "\n…" : s}
    </pre>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */

type Tab = "builder" | "tester" | "formatter" | "escaper";
type Indent = "2" | "4" | "tab" | "min";
type EscMode = "escape" | "unescape";

export default function JSONToolsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [rawJson, setRawJson] = useState(DEFAULT_JSON);
  const [selectedPath, setSelectedPath] = useState("$.store.books[0]");
  const [pathHistory, setPathHistory] = useState<string[]>(["$.store.books[0]"]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [testPath, setTestPath] = useState("$.store.books[0].title");
  const [formatIndent, setFormatIndent] = useState<Indent>("2");
  const [escaperInput, setEscaperInput] = useState('Hello "World"!\nThis has a tab:\there.');
  const [escaperMode, setEscaperMode] = useState<EscMode>("escape");
  const [copied, setCopied] = useState<string | null>(null);

  /* Parse JSON */
  const { parsed, parseError } = useMemo(() => {
    try { return { parsed: JSON.parse(rawJson), parseError: null }; }
    catch (e: unknown) { return { parsed: null, parseError: (e as Error).message }; }
  }, [rawJson]);

  /* Selected value */
  const selectedValue = useMemo(() => {
    if (!parsed || selectedPath === "$") return parsed;
    const res = evalJsonPath(parsed, selectedPath);
    return res.length > 0 ? res[0].value : undefined;
  }, [parsed, selectedPath]);

  /* Path tester results */
  const testResults = useMemo(() => {
    if (!parsed || !testPath.trim()) return [];
    try { return evalJsonPath(parsed, testPath); }
    catch { return []; }
  }, [parsed, testPath]);

  /* Formatter output */
  const formattedOutput = useMemo(() => {
    if (!parsed) return null;
    if (formatIndent === "min") return JSON.stringify(parsed);
    if (formatIndent === "tab") return JSON.stringify(parsed, null, "\t");
    return JSON.stringify(parsed, null, parseInt(formatIndent));
  }, [parsed, formatIndent]);

  /* Escaper output */
  const escaperOutput = useMemo(() => {
    if (!escaperInput) return "";
    if (escaperMode === "escape") {
      return JSON.stringify(escaperInput).slice(1, -1);
    } else {
      try {
        const fixed = escaperInput.replace(/^"|"$/g, "");
        return JSON.parse(`"${fixed.replace(/"/g, '\\"')}"`);
      } catch {
        try { return JSON.parse(`"${escaperInput}"`); }
        catch { return "⚠ Invalid escape sequences — check your input"; }
      }
    }
  }, [escaperInput, escaperMode]);

  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
    setPathHistory(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 8);
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback((path: string) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      n.has(path) ? n.delete(path) : n.add(path);
      return n;
    });
  }, []);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "builder", label: "Path Builder", icon: <MousePointerClick className="h-3.5 w-3.5" />, badge: "★" },
    { id: "tester", label: "Path Tester", icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { id: "formatter", label: "Formatter", icon: <AlignLeft className="h-3.5 w-3.5" /> },
    { id: "escaper", label: "Escaper", icon: <Braces className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-border/60">&middot;</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-amber-400 font-mono font-bold text-base">{"{}"}</span>
            JSON Tools
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Hero */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">JSON Tools</h1>
          <p className="text-sm text-muted mt-1">
            Click through any JSON tree to auto-build paths. Test, format, and escape JSON — all in your browser.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 rounded-xl border border-border/40 overflow-hidden w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === t.id ? "bg-violet-500 text-white" : "text-muted hover:text-foreground hover:bg-muted/10"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && (
                <span className={`text-[8px] font-bold px-1 rounded-full absolute -top-1 -right-1 ${
                  activeTab === t.id ? "bg-amber-400 text-gray-900" : "bg-amber-400/80 text-gray-900"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* JSON input status bar (shared) */}
        {(activeTab === "builder" || activeTab === "tester") && (
          <div className={`text-[10px] flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${
            parseError ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          }`}>
            {parseError
              ? <><AlertCircle className="h-3 w-3" /> Invalid JSON: {parseError.slice(0, 60)}</>
              : <><Check className="h-3 w-3" /> Valid JSON · {rawJson.length.toLocaleString()} chars</>}
          </div>
        )}

        {/* ══════════════ PATH BUILDER ══════════════ */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: JSON input */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">JSON Input</span>
                  <button onClick={() => setRawJson("")} className="text-[10px] text-muted hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                </div>
                <textarea
                  value={rawJson}
                  onChange={e => setRawJson(e.target.value)}
                  spellCheck={false}
                  rows={16}
                  placeholder="Paste JSON here…"
                  className="w-full bg-transparent px-4 py-3 font-mono text-[11px] text-foreground placeholder:text-muted focus:outline-none resize-y leading-relaxed"
                />
              </div>

              {/* Selected path output */}
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-bold text-violet-300">Built Path</span>
                    <span className="text-[10px] text-muted">← click any node in the tree</span>
                  </div>
                  <button
                    onClick={() => copy(selectedPath, "path")}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {copied === "path" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <div className="px-4 py-3">
                  <code className="font-mono text-sm text-violet-300 break-all">{selectedPath}</code>
                  {selectedValue !== undefined && (
                    <div className="mt-2 pt-2 border-t border-violet-500/20">
                      <p className="text-[10px] text-muted mb-1">Value at path:</p>
                      <ValuePreview value={selectedValue} />
                    </div>
                  )}
                  {selectedValue === undefined && selectedPath !== "$" && parsed && (
                    <p className="text-[10px] text-amber-400 mt-1">No value at this path in the current JSON</p>
                  )}
                </div>

                {/* Path history */}
                {pathHistory.length > 1 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    <span className="text-[10px] text-muted w-full mb-0.5">Recent:</span>
                    {pathHistory.slice(1).map(p => (
                      <button
                        key={p}
                        onClick={() => { setSelectedPath(p); setTestPath(p); }}
                        title={p}
                        className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border/40 text-muted hover:text-foreground hover:border-violet-500/40 truncate max-w-[180px] transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-4 pb-3">
                  <button
                    onClick={() => { setTestPath(selectedPath); setActiveTab("tester"); }}
                    className="text-[10px] text-violet-400 hover:underline flex items-center gap-1"
                  >
                    <FlaskConical className="h-2.5 w-2.5" /> Test this path →
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Interactive tree */}
            <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 shrink-0">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Interactive Tree</span>
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <MousePointerClick className="h-3 w-3" />
                  Click any node to build path
                </div>
              </div>
              <div className="overflow-auto flex-1 px-2 py-3 font-mono" style={{ maxHeight: "62vh" }}>
                {parseError ? (
                  <div className="px-4 py-8 text-center text-sm text-muted">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400/50" />
                    Fix the JSON error to see the tree
                  </div>
                ) : parsed !== null ? (
                  <JsonTreeNode
                    name={null}
                    value={parsed}
                    path="$"
                    depth={0}
                    collapsed={collapsed}
                    onToggle={toggleCollapsed}
                    selectedPath={selectedPath}
                    onSelect={handleSelect}
                  />
                ) : null}
              </div>

              {/* Color legend */}
              <div className="border-t border-border/20 px-4 py-2 flex gap-3 flex-wrap text-[10px]">
                {[["string", "text-emerald-400"], ["number", "text-cyan-400"], ["boolean", "text-amber-400"], ["null", "text-muted/60"]].map(([l, c]) => (
                  <span key={l} className={`flex items-center gap-1 ${c}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ PATH TESTER ══════════════ */}
        {activeTab === "tester" && (
          <div className="space-y-4">
            {/* Example paths */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-[10px] text-muted font-medium shrink-0">Quick examples:</span>
              {EXAMPLE_PATHS.map(e => (
                <button
                  key={e.path}
                  onClick={() => setTestPath(e.path)}
                  title={e.desc}
                  className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
                    testPath === e.path
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-border/40 text-muted hover:text-foreground hover:border-violet-500/40"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JSON input */}
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">JSON</span>
                  <button onClick={() => setRawJson("")} className="text-[10px] text-muted hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                </div>
                <textarea
                  value={rawJson}
                  onChange={e => setRawJson(e.target.value)}
                  spellCheck={false}
                  rows={14}
                  className="w-full bg-transparent px-4 py-3 font-mono text-[11px] text-foreground placeholder:text-muted focus:outline-none resize-y leading-relaxed"
                />
              </div>

              {/* Path input + results */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border/30 text-xs font-semibold text-muted uppercase tracking-wider">
                    JSONPath Expression
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <input
                      value={testPath}
                      onChange={e => setTestPath(e.target.value)}
                      spellCheck={false}
                      placeholder="$.store.books[*].title"
                      className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted focus:outline-none"
                    />
                    {testPath && (
                      <button onClick={() => setTestPath("")} className="text-muted hover:text-foreground">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Results</span>
                    {testResults.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-violet-400">{testResults.length} match{testResults.length !== 1 ? "es" : ""}</span>
                        <button
                          onClick={() => copy(JSON.stringify(testResults.map(r => r.value), null, 2), "testres")}
                          className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground"
                        >
                          {copied === "testres" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          Copy all
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/20">
                    {!parsed ? (
                      <div className="px-4 py-8 text-center text-sm text-muted">Fix JSON input first</div>
                    ) : testResults.length === 0 && testPath ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-2xl mb-1">🐼</p>
                        <p className="text-sm font-medium">No matches</p>
                        <p className="text-xs text-muted mt-0.5">Check your path expression or JSON</p>
                      </div>
                    ) : testResults.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted">Enter a JSONPath expression above</div>
                    ) : (
                      testResults.map((r, i) => (
                        <div key={i} className="px-4 py-2.5 hover:bg-muted/5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 bg-violet-500/20 text-violet-400">#{i + 1}</span>
                            <code className="font-mono text-[10px] text-violet-300/70 break-all">{r.path}</code>
                          </div>
                          <ValuePreview value={r.value} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ FORMATTER ══════════════ */}
        {activeTab === "formatter" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-muted">Indent:</span>
              {(["2", "4", "tab", "min"] as Indent[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFormatIndent(opt)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    formatIndent === opt
                      ? "bg-violet-500 text-white border-violet-500"
                      : "border-border/40 text-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {opt === "min" ? "Minify" : opt === "tab" ? "Tab" : `${opt} spaces`}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Input</span>
                  <button onClick={() => setRawJson("")} className="text-[10px] text-muted hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                </div>
                <textarea
                  value={rawJson}
                  onChange={e => setRawJson(e.target.value)}
                  spellCheck={false}
                  rows={18}
                  placeholder="Paste JSON to format…"
                  className={`w-full bg-transparent px-4 py-3 font-mono text-[11px] text-foreground placeholder:text-muted focus:outline-none resize-none leading-relaxed ${parseError ? "border-red-500/30" : ""}`}
                />
                {parseError && (
                  <div className="px-4 pb-3 flex items-start gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {parseError}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Output</span>
                  <div className="flex items-center gap-2">
                    {formattedOutput && (
                      <span className="text-[10px] text-muted">{formattedOutput.length.toLocaleString()} chars</span>
                    )}
                    <button
                      onClick={() => formattedOutput && copy(formattedOutput, "fmt")}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground"
                    >
                      {copied === "fmt" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                </div>
                <pre className="px-4 py-3 font-mono text-[11px] text-foreground/90 overflow-auto leading-relaxed"
                  style={{ maxHeight: "72vh", minHeight: 240 }}>
                  {formattedOutput ?? (parseError ? <span className="text-muted italic">Fix JSON errors first…</span> : "")}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ESCAPER ══════════════ */}
        {activeTab === "escaper" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-border/40 overflow-hidden">
                {(["escape", "unescape"] as EscMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setEscaperMode(m)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors capitalize ${
                      escaperMode === m ? "bg-violet-500 text-white" : "text-muted hover:text-foreground hover:bg-muted/10"
                    }`}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {m === "escape" ? "Text → JSON escaped" : "JSON escaped → Text"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {escaperMode === "escape" ? "Raw Text" : "Escaped String"}
                  </span>
                  <button onClick={() => setEscaperInput("")} className="text-[10px] text-muted hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                </div>
                <textarea
                  value={escaperInput}
                  onChange={e => setEscaperInput(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  placeholder={escaperMode === "escape" ? 'She said "hello"\nWith a newline…' : 'She said \\"hello\\"\\nWith a newline…'}
                  className="w-full bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {escaperMode === "escape" ? "JSON Escaped" : "Raw Text"}
                  </span>
                  <button
                    onClick={() => escaperOutput && copy(String(escaperOutput), "esc")}
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground"
                  >
                    {copied === "esc" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <div className="px-4 py-3 min-h-[12rem]">
                  <pre className="font-mono text-sm text-foreground/90 whitespace-pre-wrap break-all leading-relaxed">
                    {String(escaperOutput)}
                  </pre>
                </div>

                {/* Show as quoted JSON string */}
                {escaperOutput && escaperMode === "escape" && (
                  <div className="border-t border-border/20 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-muted">As JSON string (with quotes):</p>
                      <button
                        onClick={() => copy(`"${escaperOutput}"`, "escq")}
                        className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground"
                      >
                        {copied === "escq" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all bg-emerald-500/5 rounded-lg px-3 py-2">
                      "{String(escaperOutput)}"
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Escape reference */}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">JSON Escape Reference</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  ['"', '\\"', "Double quote"],
                  ["\\", "\\\\", "Backslash"],
                  ["newline", "\\n", "Newline"],
                  ["tab", "\\t", "Tab"],
                  ["return", "\\r", "Carriage return"],
                  ["null", "\\0", "Null char"],
                ].map(([raw, esc, label]) => (
                  <div key={esc} className="rounded-lg border border-border/30 bg-background/50 p-2 text-center">
                    <p className="text-[10px] text-muted mb-0.5">{label}</p>
                    <code className="text-[11px] font-mono text-violet-400">{esc}</code>
                    <p className="text-[9px] text-muted/60 mt-0.5">← {raw}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
