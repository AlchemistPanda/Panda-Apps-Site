"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeftRight, RefreshCw, TrendingUp, Coins, AlertCircle, Clock } from "lucide-react";

/* ── Currency metadata ─────────────────────────────────────────── */
const CURRENCIES: Record<string, { name: string; flag: string }> = {
  USD: { name: "US Dollar",           flag: "🇺🇸" },
  EUR: { name: "Euro",                flag: "🇪🇺" },
  GBP: { name: "British Pound",       flag: "🇬🇧" },
  JPY: { name: "Japanese Yen",        flag: "🇯🇵" },
  CAD: { name: "Canadian Dollar",     flag: "🇨🇦" },
  AUD: { name: "Australian Dollar",   flag: "🇦🇺" },
  CHF: { name: "Swiss Franc",         flag: "🇨🇭" },
  CNY: { name: "Chinese Yuan",        flag: "🇨🇳" },
  INR: { name: "Indian Rupee",        flag: "🇮🇳" },
  MXN: { name: "Mexican Peso",        flag: "🇲🇽" },
  BRL: { name: "Brazilian Real",      flag: "🇧🇷" },
  KRW: { name: "South Korean Won",    flag: "🇰🇷" },
  SGD: { name: "Singapore Dollar",    flag: "🇸🇬" },
  HKD: { name: "Hong Kong Dollar",    flag: "🇭🇰" },
  NOK: { name: "Norwegian Krone",     flag: "🇳🇴" },
  SEK: { name: "Swedish Krona",       flag: "🇸🇪" },
  DKK: { name: "Danish Krone",        flag: "🇩🇰" },
  NZD: { name: "New Zealand Dollar",  flag: "🇳🇿" },
  ZAR: { name: "South African Rand",  flag: "🇿🇦" },
  RUB: { name: "Russian Ruble",       flag: "🇷🇺" },
  TRY: { name: "Turkish Lira",        flag: "🇹🇷" },
  AED: { name: "UAE Dirham",          flag: "🇦🇪" },
  SAR: { name: "Saudi Riyal",         flag: "🇸🇦" },
  THB: { name: "Thai Baht",           flag: "🇹🇭" },
  MYR: { name: "Malaysian Ringgit",   flag: "🇲🇾" },
  IDR: { name: "Indonesian Rupiah",   flag: "🇮🇩" },
  PHP: { name: "Philippine Peso",     flag: "🇵🇭" },
  VND: { name: "Vietnamese Dong",     flag: "🇻🇳" },
  EGP: { name: "Egyptian Pound",      flag: "🇪🇬" },
  PKR: { name: "Pakistani Rupee",     flag: "🇵🇰" },
  BDT: { name: "Bangladeshi Taka",    flag: "🇧🇩" },
  NGN: { name: "Nigerian Naira",      flag: "🇳🇬" },
  KES: { name: "Kenyan Shilling",     flag: "🇰🇪" },
  GHS: { name: "Ghanaian Cedi",       flag: "🇬🇭" },
  PLN: { name: "Polish Zloty",        flag: "🇵🇱" },
  CZK: { name: "Czech Koruna",        flag: "🇨🇿" },
  HUF: { name: "Hungarian Forint",    flag: "🇭🇺" },
  RON: { name: "Romanian Leu",        flag: "🇷🇴" },
  ILS: { name: "Israeli Shekel",      flag: "🇮🇱" },
  CLP: { name: "Chilean Peso",        flag: "🇨🇱" },
  COP: { name: "Colombian Peso",      flag: "🇨🇴" },
  ARS: { name: "Argentine Peso",      flag: "🇦🇷" },
  PEN: { name: "Peruvian Sol",        flag: "🇵🇪" },
  UAH: { name: "Ukrainian Hryvnia",   flag: "🇺🇦" },
  QAR: { name: "Qatari Riyal",        flag: "🇶🇦" },
  KWD: { name: "Kuwaiti Dinar",       flag: "🇰🇼" },
  BHD: { name: "Bahraini Dinar",      flag: "🇧🇭" },
  OMR: { name: "Omani Rial",          flag: "🇴🇲" },
  JOD: { name: "Jordanian Dinar",     flag: "🇯🇴" },
  MAD: { name: "Moroccan Dirham",     flag: "🇲🇦" },
  TWD: { name: "New Taiwan Dollar",   flag: "🇹🇼" },
};

const POPULAR_PAIRS = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "GBP" },
  { from: "USD", to: "JPY" },
  { from: "USD", to: "INR" },
  { from: "EUR", to: "GBP" },
  { from: "GBP", to: "USD" },
];

type Rates = Record<string, number>;

function fmt(n: number, decimals = 4): string {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en", { maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(decimals);
}

/* ── Component ─────────────────────────────────────────────────── */
export default function CurrencyConverterClient() {
  const [rates, setRates]           = useState<Rates>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency,   setToCurrency]   = useState("INR");
  const [fromAmount,   setFromAmount]   = useState("1");

  /* ── Fetch live rates ──────────────────────────────────────────── */
  const fetchRates = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Network response was not OK");
      const data = await res.json();
      if (data.result !== "success") throw new Error("API returned an error");
      setRates(data.rates as Rates);
      setLastUpdated(new Date());
    } catch {
      setError("Could not fetch live rates. Showing cached or unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  /* ── Conversion ─────────────────────────────────────────────── */
  const toAmount = useMemo(() => {
    const n = parseFloat(fromAmount);
    if (!isFinite(n) || !rates[fromCurrency] || !rates[toCurrency]) return "";
    const result = (n / rates[fromCurrency]) * rates[toCurrency];
    return result.toLocaleString("en", {
      maximumFractionDigits: result >= 1000 ? 2 : result >= 1 ? 4 : 6,
    });
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const rate = useMemo(() => {
    if (!rates[fromCurrency] || !rates[toCurrency]) return null;
    return rates[toCurrency] / rates[fromCurrency];
  }, [fromCurrency, toCurrency, rates]);

  const inverseRate = useMemo(() => {
    if (!rate) return null;
    return 1 / rate;
  }, [rate]);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const timeSince = () => {
    if (!lastUpdated) return "";
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  /* ── Top rates table ─────────────────────────────────────────── */
  const topRates = useMemo(() => {
    const highlights = ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "CHF"];
    const base = fromCurrency;
    return highlights
      .filter((c) => c !== base && rates[c])
      .map((c) => ({
        code: c,
        rate: rates[c] / (rates[base] || 1),
      }));
  }, [fromCurrency, rates]);

  /* ── Render ──────────────────────────────────────────────────── */
  const currencyCodes = Object.keys(CURRENCIES);

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Coins className="h-3 w-3" />
            Currency Converter
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Convert{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              currencies
            </span>
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Live exchange rates for 170+ currencies. Rates refresh automatically.
          </p>
          {lastUpdated && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <Clock className="h-3 w-3" />
              Rates updated {timeSince()}
            </p>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/6 px-4 py-3.5">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── Main converter ────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="h-6 w-6 text-accent animate-spin" />
              <span className="ml-3 text-sm text-muted">Fetching live rates…</span>
            </div>
          ) : (
            <>
              {/* From */}
              <div className="px-5 pt-5 pb-4">
                <label className="text-xs font-medium text-muted mb-2 block uppercase tracking-widest">From</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    min="0"
                    className="flex-1 min-w-0 bg-transparent text-3xl font-bold tracking-tight text-foreground focus:outline-none placeholder-muted"
                    placeholder="1"
                  />
                  <CurrencySelect
                    value={fromCurrency}
                    onChange={setFromCurrency}
                    codes={currencyCodes}
                    exclude={toCurrency}
                  />
                </div>
                <p className="text-xs text-muted mt-1.5">
                  {CURRENCIES[fromCurrency]?.flag} {CURRENCIES[fromCurrency]?.name ?? fromCurrency}
                </p>
              </div>

              {/* Divider + Swap */}
              <div className="relative border-t border-border/30 flex items-center justify-center">
                <button
                  onClick={swap}
                  title="Swap currencies"
                  className="absolute bg-card border border-border/50 rounded-full p-2.5 hover:border-accent/40 hover:bg-accent/10 hover:text-accent transition-all shadow-sm"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </div>

              {/* To */}
              <div className="px-5 pt-4 pb-5">
                <label className="text-xs font-medium text-muted mb-2 block uppercase tracking-widest">To</label>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 min-w-0 text-3xl font-bold tracking-tight text-accent select-all cursor-text"
                  >
                    {toAmount || "—"}
                  </div>
                  <CurrencySelect
                    value={toCurrency}
                    onChange={setToCurrency}
                    codes={currencyCodes}
                    exclude={fromCurrency}
                  />
                </div>
                <p className="text-xs text-muted mt-1.5">
                  {CURRENCIES[toCurrency]?.flag} {CURRENCIES[toCurrency]?.name ?? toCurrency}
                </p>
              </div>

              {/* Rate info */}
              {rate !== null && (
                <div className="border-t border-border/20 bg-accent/5 px-5 py-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-muted">
                    1 {fromCurrency} = <strong className="text-foreground">{fmt(rate)} {toCurrency}</strong>
                  </span>
                  <span className="text-xs text-muted">
                    1 {toCurrency} = <strong className="text-foreground">{fmt(inverseRate!)} {fromCurrency}</strong>
                  </span>
                  <button
                    onClick={() => fetchRates(true)}
                    title="Refresh rates"
                    className="text-muted hover:text-accent transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Popular pairs ──────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Popular Pairs</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_PAIRS.map(({ from, to }) => {
              const r = rates[from] && rates[to] ? rates[to] / rates[from] : null;
              return (
                <button
                  key={`${from}-${to}`}
                  onClick={() => { setFromCurrency(from); setToCurrency(to); }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    fromCurrency === from && toCurrency === to
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border/40 bg-card/20 text-muted hover:border-accent/30 hover:text-foreground"
                  }`}
                >
                  <span>{CURRENCIES[from]?.flag} {from}</span>
                  <ArrowLeftRight className="h-3 w-3 opacity-50" />
                  <span>{CURRENCIES[to]?.flag} {to}</span>
                  {r !== null && (
                    <span className="text-accent/70 font-mono">{fmt(r, 3)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Top rates table ────────────────────────────────────── */}
        {!loading && topRates.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                1 {CURRENCIES[fromCurrency]?.flag} {fromCurrency} equals
              </span>
            </div>
            <div className="divide-y divide-border/20">
              {topRates.map(({ code, rate: r }) => (
                <button
                  key={code}
                  onClick={() => setToCurrency(code)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg leading-none">{CURRENCIES[code]?.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{CURRENCIES[code]?.name}</p>
                      <p className="text-xs text-muted">{code}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                    {r.toLocaleString("en", {
                      maximumFractionDigits: r >= 100 ? 0 : r >= 1 ? 4 : 6,
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Privacy note ──────────────────────────────────────── */}
        <p className="text-center text-xs text-muted/60 leading-relaxed">
          Exchange rates from{" "}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent/70 hover:text-accent underline"
          >
            Open Exchange Rate API
          </a>{" "}
          · Rates are indicative only. No data is sent to Panda servers.
        </p>
      </div>
    </div>
  );
}

/* ── CurrencySelect ─────────────────────────────────────────────── */
function CurrencySelect({
  value, onChange, codes, exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  codes: string[];
  exclude: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-border/40 bg-card/60 px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:border-accent/40 cursor-pointer hover:border-accent/30 transition-colors min-w-[110px]"
    >
      {codes.filter((c) => c !== exclude).map((code) => (
        <option key={code} value={code}>
          {CURRENCIES[code]?.flag ?? ""} {code} — {CURRENCIES[code]?.name ?? code}
        </option>
      ))}
    </select>
  );
}
