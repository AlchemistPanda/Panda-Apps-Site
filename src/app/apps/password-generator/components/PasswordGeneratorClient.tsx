"use client";

import { useState, useCallback, useEffect } from "react";
import {
  RefreshCw, Copy, Check, ShieldCheck, Lock,
  Eye, EyeOff, Plus, Trash2, ShieldAlert,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
══════════════════════════════════════════════════════════════════ */

type Mode = "standard" | "memorable" | "pin";

interface Settings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  customSymbols: string;
  excludeAmbiguous: boolean; // 0 O o l I 1
  noRepeating: boolean;
  mode: Mode;
  pinLength: number;
}

const DEFAULT: Settings = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  customSymbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
  excludeAmbiguous: true,
  noRepeating: false,
  mode: "standard",
  pinLength: 6,
};

const AMBIGUOUS = new Set([..."0Ool1I|`\\"]);

/* ══════════════════════════════════════════════════════════════════
   GENERATOR LOGIC
══════════════════════════════════════════════════════════════════ */

const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const VOWELS     = "aeiou";

function randomInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function generateStandard(s: Settings): string {
  let chars = "";
  if (s.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (s.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (s.numbers)   chars += "0123456789";
  if (s.symbols)   chars += s.customSymbols;
  if (s.excludeAmbiguous) chars = [...chars].filter((c) => !AMBIGUOUS.has(c)).join("");
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz"; // fallback

  let result = "";
  let attempts = 0;
  while (result.length < s.length && attempts < s.length * 20) {
    const ch = chars[randomInt(chars.length)];
    if (s.noRepeating && result.includes(ch)) { attempts++; continue; }
    result += ch;
  }

  // Guarantee at least one of each required type
  const required: string[] = [];
  if (s.uppercase) required.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ".replace(/[0Ool1I]/g, ""));
  if (s.lowercase) required.push("abcdefghijklmnopqrstuvwxyz".replace(/[0Ool1I]/g, ""));
  if (s.numbers)   required.push(s.excludeAmbiguous ? "23456789" : "0123456789");
  if (s.symbols)   required.push(s.customSymbols);

  const arr = result.split("");
  required.forEach((pool, i) => {
    const filtered = pool.split("").filter((c) => !s.excludeAmbiguous || !AMBIGUOUS.has(c));
    if (!filtered.length) return;
    const pick = filtered[randomInt(filtered.length)];
    const pos = randomInt(s.length);
    arr[pos] = pick;
  });

  // Shuffle with Fisher-Yates using crypto
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function generateMemorable(s: Settings): string {
  // CVC-style syllables with optional digits and symbols
  let words = "";
  while (words.length < s.length) {
    const cons = CONSONANTS[randomInt(CONSONANTS.length)];
    const vow  = VOWELS[randomInt(VOWELS.length)];
    const cons2 = CONSONANTS[randomInt(CONSONANTS.length)];
    words += cons + vow + cons2;
    if (s.numbers && words.length < s.length - 1) {
      words += String(randomInt(10));
    }
    if (s.symbols && words.length < s.length - 1) {
      const syms = s.customSymbols.split("").filter((c) => !AMBIGUOUS.has(c));
      if (syms.length) words += syms[randomInt(syms.length)];
    }
  }
  let result = words.slice(0, s.length);
  if (s.uppercase) {
    // Capitalise first char of each syllable group
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function generatePin(s: Settings): string {
  const digits = "0123456789";
  let pin = "";
  for (let i = 0; i < s.pinLength; i++) {
    pin += digits[randomInt(10)];
  }
  return pin;
}

export function generatePassword(s: Settings): string {
  switch (s.mode) {
    case "memorable": return generateMemorable(s);
    case "pin":       return generatePin(s);
    default:          return generateStandard(s);
  }
}

/* ══════════════════════════════════════════════════════════════════
   STRENGTH METER
══════════════════════════════════════════════════════════════════ */

interface Strength { label: string; score: number; color: string; bg: string }

function calcStrength(pwd: string, s: Settings): Strength {
  if (s.mode === "pin") {
    const score = s.pinLength >= 8 ? 2 : s.pinLength >= 6 ? 1 : 0;
    const labels = ["Weak", "Fair", "Good"];
    const colors = ["text-red-400", "text-amber-400", "text-green-400"];
    const bgs    = ["bg-red-500", "bg-amber-500", "bg-green-500"];
    return { label: labels[score], score: score + 1, color: colors[score], bg: bgs[score] };
  }

  let charsetSize = 0;
  if (s.uppercase) charsetSize += 26;
  if (s.lowercase) charsetSize += 26;
  if (s.numbers)   charsetSize += 10;
  if (s.symbols)   charsetSize += s.customSymbols.length;

  const entropy = pwd.length * Math.log2(Math.max(charsetSize, 2));

  if (entropy < 28)  return { label: "Very Weak",  score: 1, color: "text-red-400",    bg: "bg-red-500"    };
  if (entropy < 40)  return { label: "Weak",        score: 2, color: "text-orange-400", bg: "bg-orange-500" };
  if (entropy < 60)  return { label: "Fair",        score: 3, color: "text-amber-400",  bg: "bg-amber-500"  };
  if (entropy < 80)  return { label: "Strong",      score: 4, color: "text-lime-400",   bg: "bg-lime-500"   };
  if (entropy < 100) return { label: "Very Strong", score: 5, color: "text-green-400",  bg: "bg-green-500"  };
  return               { label: "Unbreakable",  score: 6, color: "text-emerald-400", bg: "bg-emerald-500"};
}

const STRENGTH_TOTAL = 6;

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */

export default function PasswordGeneratorClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [password, setPassword] = useState("");
  const [visible, setVisible]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkCopied, setBulkCopied] = useState<number | null>(null);
  const [showBulk, setShowBulk]   = useState(false);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const gen = useCallback((s: Settings = settings) => {
    setPassword(generatePassword(s));
  }, [settings]);

  // Generate on mount and whenever settings change
  useEffect(() => { gen(settings); }, [settings]); // eslint-disable-line

  const genBulk = () => {
    const list: string[] = [];
    for (let i = 0; i < bulkCount; i++) list.push(generatePassword(settings));
    setBulkList(list);
  };

  const copy = async (text: string, bulk?: number) => {
    await navigator.clipboard.writeText(text);
    if (bulk !== undefined) {
      setBulkCopied(bulk);
      setTimeout(() => setBulkCopied(null), 1500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const strength = password ? calcStrength(password, settings) : null;

  const atLeastOne =
    settings.mode !== "standard" ||
    settings.uppercase || settings.lowercase ||
    settings.numbers || settings.symbols;

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen px-4 pt-24 pb-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-medium text-amber-400">
            <Lock className="h-3 w-3" />
            Password Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Generate{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              strong passwords
            </span>
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Customise length, character types, and strength — then copy with one click.
          </p>
        </div>

        {/* ── Privacy notice ──────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/6 px-4 py-3.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              100% private — no password ever leaves your device
            </p>
            <p className="text-xs text-emerald-400/70 mt-0.5 leading-relaxed">
              Every password is generated right here in your browser using your device&apos;s
              built-in cryptographic random number generator. Nothing is sent to any server,
              nothing is saved anywhere — not even in your browser&apos;s local storage.
              The moment you close this tab, the passwords are gone.
            </p>
          </div>
        </div>

        {/* ── Password output ─────────────────────────────────── */}
        <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
          {/* Main display */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className="flex-1 min-w-0 font-mono text-lg font-semibold tracking-widest text-foreground break-all leading-relaxed select-all cursor-text"
              style={{ filter: visible || !password ? "none" : "blur(6px)", transition: "filter 0.2s" }}
            >
              {password || "—"}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setVisible((v) => !v)}
                title={visible ? "Hide" : "Show"}
                className="rounded-lg border border-border/40 bg-card/40 p-2 text-muted hover:text-foreground hover:bg-card/80 transition-colors"
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => gen(settings)}
                title="Regenerate"
                className="rounded-lg border border-border/40 bg-card/40 p-2 text-muted hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => copy(password)}
                title="Copy"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Strength bar */}
          {strength && (
            <div className="px-4 pb-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Password strength</span>
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: STRENGTH_TOTAL }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i < strength.score ? strength.bg : "bg-border/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Settings panel ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card/20 divide-y divide-border/20">

          {/* Mode */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "standard",   label: "Standard",   desc: "Random characters" },
                { id: "memorable",  label: "Memorable",  desc: "Pronounceable syllables" },
                { id: "pin",        label: "PIN",        desc: "Digits only" },
              ] as const).map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => update({ mode: id })}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    settings.mode === id
                      ? "border-amber-500/40 bg-amber-500/8"
                      : "border-border/40 bg-card/20 hover:bg-card/40"
                  }`}
                >
                  <span className={`text-sm font-semibold ${settings.mode === id ? "text-amber-300" : "text-foreground"}`}>
                    {label}
                  </span>
                  <span className="text-[11px] text-muted mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="px-5 py-4">
            {settings.mode === "pin" ? (
              <>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                  PIN Length: {settings.pinLength} digits
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[4, 5, 6, 8, 10, 12].map((n) => (
                    <button
                      key={n}
                      onClick={() => update({ pinLength: n })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        settings.pinLength === n
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-border/40 bg-card/20 text-muted hover:bg-card/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                  Length: {settings.length} characters
                </label>
                <input
                  type="range"
                  min={4}
                  max={128}
                  step={1}
                  value={settings.length}
                  onChange={(e) => update({ length: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>4</span>
                  <div className="flex gap-2">
                    {[8, 12, 16, 20, 32, 64, 128].map((n) => (
                      <button
                        key={n}
                        onClick={() => update({ length: n })}
                        className={`rounded px-1.5 py-0.5 transition-colors ${
                          settings.length === n ? "bg-amber-500/20 text-amber-300" : "hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <span>128</span>
                </div>
              </>
            )}
          </div>

          {/* Character types — only for standard/memorable */}
          {settings.mode !== "pin" && (
            <div className="px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Character Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "uppercase", label: "Uppercase",  example: "A–Z",   disabled: false },
                  { key: "lowercase", label: "Lowercase",  example: "a–z",   disabled: false },
                  { key: "numbers",   label: "Numbers",    example: "0–9",   disabled: false },
                  { key: "symbols",   label: "Symbols",    example: "!@#…",  disabled: settings.mode === "memorable" },
                ] as const).map(({ key, label, example, disabled }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all cursor-pointer ${
                      settings[key] && !disabled
                        ? "border-amber-500/30 bg-amber-500/5"
                        : disabled
                        ? "border-border/20 bg-card/10 opacity-40 cursor-not-allowed"
                        : "border-border/40 bg-card/20 hover:bg-card/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings[key] && !disabled}
                      disabled={disabled}
                      onChange={(e) => update({ [key]: e.target.checked })}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-[11px] text-muted font-mono">{example}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom symbols */}
          {settings.mode === "standard" && settings.symbols && (
            <div className="px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                Symbol Set
              </label>
              <input
                type="text"
                value={settings.customSymbols}
                onChange={(e) => update({ customSymbols: e.target.value || "!@#$%" })}
                className="w-full rounded-xl border border-border/40 bg-card/30 px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-amber-500/50"
                placeholder="!@#$%^&*()"
              />
              <p className="text-[11px] text-muted mt-1.5">Edit to include or exclude specific symbols.</p>
            </div>
          )}

          {/* Extra options */}
          {settings.mode === "standard" && (
            <div className="px-5 py-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted">
                Options
              </label>
              {([
                { key: "excludeAmbiguous", label: "Exclude ambiguous characters", desc: "Removes 0, O, o, l, I, 1 — easier to read" },
                { key: "noRepeating",      label: "No repeating characters",      desc: "Each character appears at most once" },
              ] as const).map(({ key, label, desc }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => update({ [key]: !settings[key] })}
                    className={`relative h-5 w-9 rounded-full border transition-colors cursor-pointer flex-shrink-0 ${
                      settings[key]
                        ? "bg-amber-500 border-amber-500"
                        : "bg-card border-border/50"
                    }`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      settings[key] ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{label}</p>
                    <p className="text-[11px] text-muted">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ── Bulk Generator ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card/20 overflow-hidden">
          <button
            onClick={() => { setShowBulk((v) => !v); if (!showBulk) genBulk(); }}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground hover:bg-card/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-400" />
              Bulk Generate
            </span>
            <span className="text-xs text-muted">{showBulk ? "Hide" : "Generate multiple passwords at once"}</span>
          </button>

          {showBulk && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
              {/* Count */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted">How many:</span>
                {[3, 5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBulkCount(n)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      bulkCount === n
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-border/40 bg-card/20 text-muted hover:bg-card/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={genBulk}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </button>
              </div>

              {/* List */}
              <div className="space-y-2">
                {bulkList.map((pwd, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/30 px-3.5 py-2.5"
                  >
                    <span className="text-[11px] text-muted w-5 text-right flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 font-mono text-sm text-foreground break-all">{pwd}</span>
                    <button
                      onClick={() => copy(pwd, i)}
                      className="flex-shrink-0 rounded-lg border border-border/30 bg-card/40 p-1.5 text-muted hover:text-amber-300 hover:border-amber-500/30 transition-all"
                    >
                      {bulkCopied === i ? (
                        <Check className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Copy all */}
              <button
                onClick={() => copy(bulkList.join("\n"))}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-card/20 px-4 py-2.5 text-sm font-medium text-muted hover:bg-card/40 hover:text-foreground transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy all {bulkCount} passwords
              </button>

              {/* Privacy reminder in bulk section */}
              <p className="text-center text-[11px] text-muted/70">
                These passwords exist only in your browser memory — they disappear when you leave this page.
              </p>
            </div>
          )}
        </div>

        {/* ── Tips ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card/20 px-5 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Password Tips</p>
          <ul className="space-y-2 text-xs text-muted leading-relaxed">
            <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Use a <strong className="text-foreground">unique password</strong> for every account. Never reuse passwords.</li>
            <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Aim for <strong className="text-foreground">20+ characters</strong> for important accounts like email and banking.</li>
            <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Store passwords in a <strong className="text-foreground">password manager</strong> (Bitwarden, 1Password, Apple Passwords) — never in a text file.</li>
            <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Enable <strong className="text-foreground">two-factor authentication (2FA)</strong> wherever possible.</li>
            <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Never share a password via chat, email, or screenshot.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
