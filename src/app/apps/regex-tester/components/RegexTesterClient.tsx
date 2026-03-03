"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Copy, Check, AlertCircle, X, RotateCcw,
  ChevronDown, ChevronUp, BookOpen, Shield, Replace,
} from "lucide-react";
import HelpTip from "@/components/HelpTip";

/* ── Constants ── */
const QUICK_PATTERNS = [
  { label: "Email",           pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", flags: "gi", description: "Valid email addresses" },
  { label: "URL",             pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)", flags: "gi", description: "HTTP/HTTPS URLs" },
  { label: "IP Address",      pattern: "\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d{1,2})(?:\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d{1,2})){3}\\b", flags: "g", description: "IPv4 addresses" },
  { label: "Phone (US)",      pattern: "\\+?1?\\s?\\(?([0-9]{3})\\)?[\\-\\s.]([0-9]{3})[\\-\\s.]([0-9]{4})", flags: "g", description: "US phone numbers" },
  { label: "Date YYYY-MM-DD", pattern: "\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b", flags: "g", description: "ISO date format" },
  { label: "Hex Color",       pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b", flags: "gi", description: "CSS hex colors (#fff, #1a2b3c)" },
  { label: "HTML Tag",        pattern: "<([a-z][a-z0-9]*)\\b([^>]*)>", flags: "gi", description: "Opening HTML tag with attributes" },
  { label: "Digits",          pattern: "\\d+", flags: "g", description: "One or more digits" },
  { label: "Words",           pattern: "\\b[A-Za-z]+\\b", flags: "g", description: "Complete alphabetic words" },
  { label: "Whitespace (multi)", pattern: "\\s{2,}", flags: "g", description: "Two or more whitespace chars" },
  { label: "Slug",            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "", description: "URL-safe slug" },
  { label: "Strong Password", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", flags: "", description: "≥8 chars, mixed case + digit + symbol" },
  { label: "JSON String",     pattern: "\"((?:[^\"\\\\]|\\\\.)*)\"", flags: "g", description: "Double-quoted JSON string values" },
  { label: "Semantic Version","pattern": "\\b(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?\\b", flags: "g", description: "Semver e.g. 1.2.3-beta.1" },
];



type Mode = "match" | "replace";

type MatchResult = {
  text: string;
  index: number;
  end: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string> | null;
};

const MATCH_COLORS = [
  { bg: "bg-violet-500/30",  text: "text-violet-300",  badge: "bg-violet-500/20 text-violet-300" },
  { bg: "bg-blue-500/30",    text: "text-blue-300",    badge: "bg-blue-500/20 text-blue-300" },
  { bg: "bg-emerald-500/30", text: "text-emerald-300", badge: "bg-emerald-500/20 text-emerald-300" },
  { bg: "bg-amber-500/30",   text: "text-amber-300",   badge: "bg-amber-500/20 text-amber-300" },
  { bg: "bg-rose-500/30",    text: "text-rose-300",    badge: "bg-rose-500/20 text-rose-300" },
  { bg: "bg-cyan-500/30",    text: "text-cyan-300",    badge: "bg-cyan-500/20 text-cyan-300" },
];

const CHEAT_SHEET: [string, string][] = [
  [".", "Any char (except newline)"], ["\\d", "Digit [0-9]"], ["\\D", "Non-digit"], ["\\w", "Word char [a-zA-Z0-9_]"],
  ["\\W", "Non-word char"], ["\\s", "Whitespace"], ["\\S", "Non-whitespace"], ["\\b", "Word boundary"],
  ["^", "Start of string/line"], ["$", "End of string/line"], ["*", "0 or more"], ["+", "1 or more"],
  ["?", "0 or 1 (optional)"], ["*?", "Lazy 0 or more"], ["+?", "Lazy 1 or more"], ["{n,m}", "n to m times"],
  ["[abc]", "Char class"], ["[^abc]", "Negated class"], ["(a|b)", "a or b"], ["(?:...)", "Non-capturing group"],
  ["(?=...)", "Lookahead"], ["(?!...)", "Negative lookahead"], ["(?<=...)", "Lookbehind"], ["(?<!...)", "Neg. lookbehind"],
  ["(?<name>...)", "Named group"], ["\\1", "Backreference #1"], ["$1", "Replace: group #1"], ["$&", "Replace: whole match"],
];

const FLAG_INFO: { f: string; label: string; tip: string; example?: string }[] = [
  { f: "g", label: "g — Global",      tip: "Find every match in the string, not just the first one.",   example: '/a/g on "abca" matches both a\'s' },
  { f: "i", label: "i — Ignore Case", tip: "Match uppercase and lowercase letters interchangeably.",      example: '/hello/i matches "Hello" and "HELLO"' },
  { f: "m", label: "m — Multiline",   tip: "^ and $ match the start/end of each line, not just the whole string.", example: '/^hi/m matches "hi" at start of any line' },
  { f: "s", label: "s — Dot-All",     tip: "Makes . also match newline characters. Without this flag, . skips newlines.", example: '/a.b/s matches "a\\nb"' },
  { f: "u", label: "u — Unicode",     tip: "Full Unicode support. Required for emoji and non-BMP character matching.", example: '/\\u{1F600}/u matches 😀' },
];

const MODE_INFO = {
  match:   { tip: "Highlight every match in the test string. Each match is listed with its position and capture groups." },
  replace: { tip: "Replace all matches with a substitution string. Use $1, $2 for numbered groups, $<name> for named groups, $& for the whole match." },
};

/* ── Inline-Highlight Textarea ── */

type HLProps = {
  value: string;
  onChange: (v: string) => void;
  segments: { text: string; isMatch: boolean; idx: number }[] | null;
  placeholder?: string;
  rows?: number;
};

function HighlightTextarea({ value, onChange, segments, placeholder, rows = 14 }: HLProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop  = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <div className="relative font-mono text-sm leading-relaxed">
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden pointer-events-none select-none"
        style={{ wordBreak: "break-all" }}
      >
        {segments
          ? segments.map((seg, i) => {
              const col = MATCH_COLORS[seg.idx % MATCH_COLORS.length];
              return seg.isMatch ? (
                <mark key={i} className={`rounded-sm not-italic ${col.bg} ${col.text}`} style={{ padding: "0 1px" }}>
                  {seg.text}
                </mark>
              ) : (
                <span key={i} className="text-foreground/80">{seg.text}</span>
              );
            })
          : <span className="text-transparent" aria-hidden="true">{value}</span>
        }
        {"\n"}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={onScroll}
        spellCheck={false}
        rows={rows}
        placeholder={placeholder}
        className="relative w-full bg-transparent px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none resize-none placeholder:text-muted"
        style={{ color: "transparent", caretColor: "#c4b5fd", minHeight: `${rows * 1.625}rem` }}
      />
    </div>
  );
}

export default function RegexTesterClient() {
  const [pattern, setPattern]       = useState("");
  const [flags, setFlags]           = useState<Set<string>>(new Set(["g"]));
  const [testStr, setTestStr]       = useState("");
  const [replaceStr, setReplaceStr] = useState("$&");
  const [mode, setMode]             = useState<Mode>("match");
  const [showLib, setShowLib]       = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const patternRef = useRef<HTMLInputElement>(null);

  const flagStr = useMemo(
    () => FLAG_INFO.map(f => f.f).filter(f => flags.has(f)).join(""),
    [flags],
  );
  const isGlobal = flags.has("g");

  /* Build regex */
  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      return { regex: new RegExp(pattern, flagStr), error: null };
    } catch (e: unknown) {
      return { regex: null, error: (e as Error).message };
    }
  }, [pattern, flagStr]);

  /* Collect matches */
  const matches = useMemo((): MatchResult[] => {
    if (!regex || !testStr) return [];
    if (!isGlobal) {
      const m = regex.exec(testStr);
      if (!m) return [];
      return [{ text: m[0], index: m.index, end: m.index + m[0].length, groups: Array.from(m).slice(1), namedGroups: m.groups ? { ...m.groups } : null }];
    }
    const r = new RegExp(pattern, flagStr);
    const out: MatchResult[] = [];
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = r.exec(testStr)) !== null && guard++ < 1000) {
      out.push({ text: m[0], index: m.index, end: m.index + m[0].length, groups: Array.from(m).slice(1), namedGroups: m.groups ? { ...m.groups } : null });
      if (m[0].length === 0) r.lastIndex++;
    }
    return out;
  }, [regex, testStr, pattern, flagStr, isGlobal]);

  /* Build highlight segments */
  const segments = useMemo(() => {
    if (!matches.length || !testStr) return null;
    const segs: { text: string; isMatch: boolean; idx: number }[] = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      if (m.index > cursor) segs.push({ text: testStr.slice(cursor, m.index), isMatch: false, idx: -1 });
      segs.push({ text: m.text, isMatch: true, idx: i });
      cursor = m.end;
    });
    if (cursor < testStr.length) segs.push({ text: testStr.slice(cursor), isMatch: false, idx: -1 });
    return segs;
  }, [matches, testStr]);

  /* Replace result */
  const replaceResult = useMemo(() => {
    if (!regex || !testStr || mode !== "replace") return null;
    try {
      return testStr.replace(new RegExp(pattern, flagStr), replaceStr);
    } catch {
      return null;
    }
  }, [regex, testStr, replaceStr, pattern, flagStr, mode]);

  function toggleFlag(f: string) {
    setFlags(prev => {
      const n = new Set(prev);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });
  }

  function loadPattern(p: (typeof QUICK_PATTERNS)[0]) {
    setPattern(p.pattern);
    setFlags(new Set(p.flags.split("").filter(Boolean)));
    patternRef.current?.focus();
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

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
            <span className="text-violet-500 font-mono font-bold text-base">/ab/</span>
            Regex Tester
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Runs entirely in your browser</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Hero */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Regex Tester</h1>
          <p className="text-sm text-muted mt-1">
            Write a pattern, paste your text — matches highlight instantly inline.
          </p>
        </div>

        {/* ── Pattern Input ── */}
        <div className="rounded-2xl border border-border/40 bg-card/30 p-4 space-y-3">
          {/* Input row */}
          <div className="flex gap-2">
            <div
              className={`flex flex-1 items-center rounded-xl border ${
                error ? "border-red-500/60" : "border-border/50"
              } bg-background/60 focus-within:border-violet-500/60 transition-colors overflow-hidden`}
            >
              <span className="px-3 text-violet-400 font-mono text-xl font-bold select-none leading-none">/</span>
              <input
                ref={patternRef}
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                placeholder="Enter pattern…"
                spellCheck={false}
                className="flex-1 bg-transparent py-2.5 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
              <span className="pl-0.5 pr-1 text-violet-400 font-mono text-xl font-bold select-none leading-none">/{flagStr}</span>
              {pattern && (
                <button onClick={() => setPattern("")} className="px-2 text-muted hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => copy(`/${pattern}/${flagStr}`, "pattern")}
              title="Copy as /pattern/flags"
              className="flex items-center gap-1.5 px-3 rounded-xl border border-border/40 text-xs text-muted hover:text-foreground hover:border-border transition-all shrink-0"
            >
              {copied === "pattern" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Copy</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="font-mono break-all">{error}</span>
            </div>
          )}

          {/* Flags + mode row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted font-medium shrink-0">Flags:</span>
            {FLAG_INFO.map(({ f, label, tip, example }) => (
              <div key={f} className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleFlag(f)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                    flags.has(f)
                      ? "bg-violet-500 border-violet-500 text-white shadow-sm"
                      : "border-border/40 text-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {f}
                </button>
                <HelpTip label={label} tip={tip} extra={example ? (
                  <code className="text-[10px] font-mono text-violet-300 bg-violet-500/10 rounded px-1.5 py-0.5 block">{example}</code>
                ) : undefined} />
              </div>
            ))}
            <div className="ml-auto flex rounded-lg border border-border/40 overflow-hidden shrink-0">
              {(["match", "replace"] as Mode[]).map(m => (
                <div key={m} className="flex items-center">
                  <button
                    onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      mode === m ? "bg-violet-500 text-white" : "text-muted hover:text-foreground hover:bg-muted/10"
                    }`}
                  >
                    {m === "replace" ? <Replace className="h-3 w-3" /> : <span className="font-mono font-bold text-[11px]">/ab/</span>}
                    {m}
                  </button>
                  {m === mode && (
                    <div className="pr-2">
                      <HelpTip label={m === "match" ? "Match mode" : "Replace mode"} tip={MODE_INFO[m].tip} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Match count */}
          {pattern && !error && testStr && (
            <div className={`text-[10px] flex items-center gap-1.5 ${matches.length > 0 ? "text-violet-400" : "text-muted"}`}>
              {matches.length > 0
                ? <><Check className="h-3 w-3 text-emerald-400" /><span className="font-bold">{matches.length}</span> match{matches.length !== 1 ? "es" : ""}</>
                : <><AlertCircle className="h-3 w-3" /> No matches</>
              }
            </div>
          )}
        </div>

        {/* ── Main panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: test input */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Test String</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted tabular-nums">{testStr.length} chars · {testStr.split("\n").length} lines</span>
                  <button
                    onClick={() => setTestStr("")}
                    className="text-[10px] text-muted hover:text-foreground flex items-center gap-0.5"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                </div>
              </div>
              <HighlightTextarea
                value={testStr}
                onChange={setTestStr}
                segments={segments}
                placeholder={"Paste or type your test string…\nmatches highlight instantly inline"}
                rows={14}
              />
            </div>

            {/* Replace input */}
            {mode === "replace" && (
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Replace With</span>
                  <HelpTip
                    label="Substitution syntax"
                    tip="Special tokens in the replacement string:"
                    extra={
                      <div className="space-y-1">
                        {[["$&", "Entire match"], ["$1 $2", "Numbered capture groups"], ["$<name>", "Named capture group"]].map(([t, d]) => (
                          <div key={t} className="flex gap-2">
                            <code className="text-violet-300 text-[10px] font-mono shrink-0">{t}</code>
                            <span className="text-[10px] text-muted/80">{d}</span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
                <input
                  type="text"
                  value={replaceStr}
                  onChange={e => setReplaceStr(e.target.value)}
                  placeholder="Replacement (supports $1, $2, $&)…"
                  spellCheck={false}
                  className="w-full bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Right: match details OR replace result + cheat sheet */}
          <div className="space-y-3">
            {mode === "match" ? (
              matches.length > 0 ? (
                <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">Match Details</span>
                      <HelpTip
                        label="Match details"
                        tip="Each match shows its text, position (start–end index), and any capture groups."
                        extra={<p className="text-[10px] text-muted">Capture group: <code className="font-mono text-violet-300">(...)</code> &nbsp; Named: <code className="font-mono text-violet-300">(?&lt;name&gt;...)</code></p>}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-violet-400">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/20">
                    {matches.map((m, i) => {
                      const col = MATCH_COLORS[i % MATCH_COLORS.length];
                      return (
                        <div key={i} className="px-4 py-2.5 hover:bg-muted/5 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${col.badge}`}>#{i + 1}</span>
                              <code className="font-mono text-[11px] text-foreground break-all">{m.text || "(empty match)"}</code>
                            </div>
                            <span className="text-[10px] text-muted tabular-nums shrink-0 pt-0.5">[{m.index}–{m.end}]</span>
                          </div>
                          {m.groups.filter(g => g !== undefined).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {m.groups.map((g, gi) => (
                                <span key={gi} className="text-[10px] bg-muted/15 rounded px-1.5 py-0.5 font-mono">
                                  <span className="text-muted">${gi + 1}:</span>{" "}
                                  <span className="text-foreground">{g ?? "—"}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(m.namedGroups).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-violet-500/10 rounded px-1.5 py-0.5 font-mono">
                                  <span className="text-violet-400">{k}:</span>{" "}
                                  <span className="text-foreground">{v}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/40 bg-card/30 px-4 py-12 text-center">
                  <p className="text-3xl mb-2">🐼</p>
                  <p className="text-sm font-medium text-muted">
                    {pattern && !error && testStr ? "No matches found" : "Match details appear here"}
                  </p>
                  <p className="text-xs text-muted/60 mt-1">
                    {pattern && !error && testStr ? "Try adjusting your pattern or flags" : "Write a pattern and paste your test string"}
                  </p>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Replace Result</span>
                  {replaceResult !== null && (
                    <button onClick={() => copy(replaceResult, "replace")} className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground">
                      {copied === "replace" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  )}
                </div>
                <div className="px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all min-h-48 max-h-96 overflow-y-auto text-emerald-400">
                  {replaceResult !== null ? replaceResult : <span className="text-muted italic">Result will appear here…</span>}
                </div>
              </div>
            )}

            {/* Cheat Sheet */}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Cheat Sheet — click a token to append</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {CHEAT_SHEET.map(([tok, desc]) => (
                  <div key={tok} className="flex items-baseline gap-2 min-w-0">
                    <code
                      onClick={() => { setPattern(p => p + tok); patternRef.current?.focus(); }}
                      title="Click to append to pattern"
                      className="shrink-0 font-mono text-[11px] font-bold text-violet-400 bg-violet-500/10 rounded px-1 py-0.5 cursor-pointer hover:bg-violet-500/25 transition-colors select-none"
                    >
                      {tok}
                    </code>
                    <span className="text-muted text-[10px] leading-tight truncate">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Library */}
        <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
          <button
            onClick={() => setShowLib(r => !r)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/5 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Pattern Library
              <span className="text-[10px] font-normal text-muted">{QUICK_PATTERNS.length} patterns — click any to load</span>
            </span>
            {showLib ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
          </button>
          {showLib && (
            <div className="border-t border-border/30 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {QUICK_PATTERNS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => loadPattern(p)}
                    className="text-left rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-violet-400 group-hover:underline">{p.label}</span>
                      {p.flags && (
                        <span className="text-[9px] font-mono text-muted bg-muted/10 rounded px-1 py-0.5">/{p.flags}/</span>
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-muted block truncate">{p.pattern}</code>
                    <p className="text-[10px] text-muted/60 mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
