"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Info, AlertCircle, ExternalLink } from "lucide-react";
import {
  GOLD_SPOT,
  SILVER_SPOT,
  METAL_TREND,
  DATA_DATE,
  USD_INR,
  TROY_OZ_TO_G,
  TOLA_TO_G,
  goldInr22k,
  type TrendPoint,
} from "../data/metalData";
import ThemeToggle from "@/components/ThemeToggle";

// ── Chart constants ───────────────────────────────────────────────────────────
const PAD = { left: 58, right: 16, top: 20, bottom: 50 };
const VW = 600;
const VH = 260;
const PW = VW - PAD.left - PAD.right;
const PH = VH - PAD.top  - PAD.bottom;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

type GRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "2Y" | "5Y" | "10Y";
const G_RANGE_POINTS: Record<GRange, number | null> = {
  "1D": null, "1W": null, "1M": 2, "6M": 6, "1Y": 12, "2Y": 24, "5Y": 60, "10Y": 121,
};
const G_RANGES: GRange[] = ["1D","1W","1M","6M","1Y","2Y","5Y","10Y"];

function gLabelStep(n: number) {
  if (n <= 6)  return 1;
  if (n <= 14) return 2;
  if (n <= 30) return 3;
  if (n <= 60) return 6;
  return 12;
}

interface ChartProps {
  data:   TrendPoint[];
  field:  "gold" | "silver";
  color:  string;
  prefix: string;
}

function TrendChart({ data: allData, field, color, prefix }: ChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [range, setRange]       = useState<GRange>("1Y");
  const pts  = G_RANGE_POINTS[range];
  const data = pts !== null ? allData.slice(-pts) : allData;
  const xStep = data.length > 1 ? PW / (data.length - 1) : PW;

  const vals   = data.map((d) => d[field]);
  const dMin   = Math.floor(Math.min(...vals) * 0.995);
  const dMax   = Math.ceil (Math.max(...vals) * 1.004);

  const xP = (i: number)   => PAD.left + i * xStep;
  const yP = (v: number)    => PAD.top + PH - ((v - dMin) / (dMax - dMin)) * PH;

  const linePoints = data.map((d, i) => `${xP(i)},${yP(d[field])}`).join(" ");
  const areaPath   = `M ${xP(0)},${yP(dMin)} L ${data.map((d, i) => `${xP(i)},${yP(d[field])}`).join(" L ")} L ${xP(data.length - 1)},${yP(dMin)} Z`;

  const gridVals: number[] = Array.from({ length: 5 }, (_, i) => lerp(dMin, dMax, i / 4));

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const relX   = (e.clientX - rect.left) * scaleX - PAD.left;
    setHoverIdx(Math.max(0, Math.min(data.length - 1, Math.round(relX / xStep))));
  }, [xStep, data.length]);

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  const TOOLTIP_W = 148;
  const ttX = hoverIdx !== null ? xP(hoverIdx) : 0;
  const ttXF = ttX > VW / 2 ? ttX - TOOLTIP_W - 10 : ttX + 10;

  // change % for the current slice
  const sliceFirst = data[0];
  const sliceLast  = data[data.length - 1];
  const chgPct = sliceFirst && sliceLast
    ? ((sliceLast[field] - sliceFirst[field]) / sliceFirst[field]) * 100 : 0;
  const chgUp = chgPct >= 0;

  return (
    <>
      {/* Range filter row */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {G_RANGES.map((r) => {
          const disabled = G_RANGE_POINTS[r] === null;
          const active   = range === r;
          return (
            <button key={r} disabled={disabled} onClick={() => setRange(r)}
              title={disabled ? "Requires live intraday data" : undefined}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all
                ${disabled
                  ? "text-muted/30 cursor-not-allowed"
                  : active
                    ? `text-white shadow-sm`
                    : "text-muted hover:text-foreground hover:bg-white/10"}`}
              style={active && !disabled ? { backgroundColor: color } : undefined}>
              {r}
            </button>
          );
        })}
        <span className={`ml-auto text-[11px] font-semibold ${chgUp ? "text-green-400" : "text-red-400"}`}>
          {chgUp ? "+" : ""}{chgPct.toFixed(1)}%
        </span>
      </div>

      {pts === null ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted/50">
          Intraday / weekly data requires a live market API
        </div>
      ) : (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      className="overflow-visible cursor-crosshair select-none"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <defs>
        <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grid + Y labels */}
      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={yP(v)} x2={VW - PAD.right} y2={yP(v)}
            stroke="rgba(128,128,128,0.12)" strokeWidth="1" />
          <text x={PAD.left - 5} y={yP(v) + 4} textAnchor="end"
            fontSize="9" fill="rgba(128,128,128,0.7)" fontFamily="monospace">
            {prefix}{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(field === "silver" ? 0 : 0)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => i % gLabelStep(data.length) === 0 && (
        <text key={i} x={xP(i)} y={VH - PAD.bottom + 18} textAnchor="middle"
          fontSize="9" fill="rgba(128,128,128,0.7)" fontFamily="system-ui, sans-serif">
          {d.month}
        </text>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill={`url(#grad-${field})`} />
      <polyline points={linePoints} fill="none" stroke={color}
        strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Hover overlay */}
      {hoverIdx !== null && hovered && (
        <>
          <line x1={xP(hoverIdx)} y1={PAD.top} x2={xP(hoverIdx)} y2={PAD.top + PH}
            stroke="rgba(128,128,128,0.35)" strokeWidth="1" strokeDasharray="4 3" />
          <circle cx={xP(hoverIdx)} cy={yP(hovered[field])} r={4.5}
            fill={color} stroke="rgba(15,15,15,0.9)" strokeWidth="2" />
          {/* Tooltip */}
          <rect x={Math.max(4, Math.min(ttXF, VW - TOOLTIP_W - 4))} y={PAD.top + 4}
            width={TOOLTIP_W} height={50} rx={8} ry={8}
            fill="rgba(18,18,18,0.94)" stroke="rgba(128,128,128,0.25)" strokeWidth="1" />
          <text x={Math.max(4, Math.min(ttXF, VW - TOOLTIP_W - 4)) + 10} y={PAD.top + 21}
            fontSize="9.5" fontWeight="600" fill="rgba(255,255,255,0.55)"
            fontFamily="system-ui, sans-serif">
            {hovered.month}
          </text>
          <circle cx={Math.max(4, Math.min(ttXF, VW - TOOLTIP_W - 4)) + 14}
            cy={PAD.top + 36} r={3.5} fill={color} />
          <text x={Math.max(4, Math.min(ttXF, VW - TOOLTIP_W - 4)) + 24}
            y={PAD.top + 40} fontSize="10.5" fill="rgba(255,255,255,0.9)"
            fontFamily="monospace">
            {prefix}{hovered[field].toLocaleString("en-US", { minimumFractionDigits: field === "silver" ? 2 : 0 })}/oz
          </text>
        </>
      )}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top + PH} x2={VW - PAD.right} y2={PAD.top + PH}
        stroke="rgba(128,128,128,0.2)" strokeWidth="1" />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PH}
        stroke="rgba(128,128,128,0.2)" strokeWidth="1" />
    </svg>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtUsd(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Main component ────────────────────────────────────────────────────────────
type Metal = "gold" | "silver";

interface LivePrices {
  gold:      { usdPerOz: number; inrPerGram: number };
  silver:    { usdPerOz: number; inrPerGram: number };
  usdInr:    number;
  updatedAt: string;
}

export default function GoldSilverClient() {
  const [metal, setMetal]       = useState<Metal>("gold");
  const [live, setLive]         = useState<LivePrices | null>(null);
  const [liveStatus, setLiveStatus] = useState<"loading" | "live" | "static">("loading");

  useEffect(() => {
    fetch("/api/metals")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: LivePrices) => {
        setLive(data);
        setLiveStatus("live");
      })
      .catch(() => setLiveStatus("static"));
  }, []);

  const goldSpot  = live ? live.gold  : GOLD_SPOT;
  const silverSpot = live ? live.silver : SILVER_SPOT;
  const currentUsdInr = live ? live.usdInr : USD_INR;

  const spot    = metal === "gold" ? goldSpot : silverSpot;
  const isGold  = metal === "gold";

  // Derived INR prices
  const inrPerGram   = spot.inrPerGram;
  const inrPer10g    = inrPerGram * 10;
  const inrPerTola   = inrPerGram * TOLA_TO_G;
  const inrPerTroyOz = inrPerGram * TROY_OZ_TO_G;
  const inrPerKg     = inrPerGram * 1000;
  const inr22kPerGram = isGold ? goldInr22k(inrPerGram) : null;

  // Derived USD prices
  const usdPerOz    = spot.usdPerOz;
  const usdPerGram  = usdPerOz / TROY_OZ_TO_G;
  const usdPerKg    = usdPerGram * 1000;

  // Trend data change (first → last)
  const trendFirst = METAL_TREND[0][metal];
  const trendLast  = METAL_TREND[METAL_TREND.length - 1][metal];
  const trendPct   = ((trendLast - trendFirst) / trendFirst) * 100;
  const trendUp    = trendPct >= 0;

  const goldGrad   = "from-yellow-500 to-amber-600";
  const silverGrad = "from-slate-400 to-gray-500";
  const activeGrad = isGold ? goldGrad : silverGrad;
  const accentColor = isGold ? "text-yellow-500" : "text-slate-400";
  const accentBg    = isGold ? "bg-yellow-500/10" : "bg-slate-500/10";
  const accentBorder = isGold ? "border-yellow-500/20" : "border-slate-500/20";
  const chartColor  = isGold ? "rgb(234,179,8)" : "rgb(148,163,184)";

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link href="/#apps" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${activeGrad} flex items-center justify-center transition-all duration-300`}>
              <span className="text-[11px] font-bold text-white">{isGold ? "Au" : "Ag"}</span>
            </div>
            <span className="font-semibold text-sm">Gold &amp; Silver Prices</span>
          </div>
          <div className="ml-auto" />
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 rounded-full ${accentBg} border ${accentBorder} px-4 py-1.5 text-xs font-medium ${accentColor} mb-2`}>
            <TrendingUp className="h-3 w-3" />
            Live Precious Metal Prices
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Gold &amp; Silver Prices</h1>
          <p className="text-muted max-w-xl mx-auto">
            Current prices for India (₹) and international (USD) markets.{" "}
            {liveStatus === "live" ? (
              <span className="inline-flex items-center gap-1 text-green-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live prices
              </span>
            ) : liveStatus === "static" ? (
              <span className="text-muted/60">Updated {DATA_DATE}</span>
            ) : (
              <span className="text-muted/40">Loading live prices…</span>
            )}
          </p>
        </div>

        {/* Metal tab switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl border border-border/40 bg-card/30 w-fit mx-auto">
          {(["gold", "silver"] as Metal[]).map((m) => {
            const active = metal === m;
            const grad   = m === "gold" ? goldGrad : silverGrad;
            return (
              <button
                key={m}
                onClick={() => setMetal(m)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${active
                    ? `bg-gradient-to-r ${grad} text-white shadow-md`
                    : "text-muted hover:text-foreground hover:bg-white/5"
                  }`}
              >
                <span className="font-mono text-xs opacity-80">{m === "gold" ? "Au" : "Ag"}</span>
                {m === "gold" ? "Gold" : "Silver"}
              </button>
            );
          })}
        </div>

        {/* ── Price Cards grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* India INR card */}
          <div className={`rounded-2xl border ${accentBorder} bg-gradient-to-br ${isGold ? "from-yellow-500/10 to-amber-500/5" : "from-slate-500/10 to-gray-500/5"} p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest ${accentColor}`}>India</span>
                <p className="text-lg font-bold mt-0.5">₹ INR Prices</p>
              </div>
              <div className={`h-9 w-9 rounded-full ${accentBg} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${accentColor}`}>₹</span>
              </div>
            </div>

            <div className="space-y-2">
              {isGold && (
                <div className={`rounded-xl ${accentBg} px-4 py-3 flex items-center justify-between`}>
                  <span className="text-sm text-muted">24K · per gram</span>
                  <span className={`text-lg font-bold tabular-nums ${accentColor}`}>₹{fmt(inrPerGram, 0)}</span>
                </div>
              )}
              {isGold && inr22kPerGram && (
                <div className="rounded-xl bg-white/5 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted">22K · per gram</span>
                  <span className="text-base font-semibold tabular-nums">₹{fmt(inr22kPerGram, 0)}</span>
                </div>
              )}
              {!isGold && (
                <div className={`rounded-xl ${accentBg} px-4 py-3 flex items-center justify-between`}>
                  <span className="text-sm text-muted">Pure · per gram</span>
                  <span className={`text-lg font-bold tabular-nums ${accentColor}`}>₹{fmt(inrPerGram, 2)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {(isGold
                  ? [
                      ["10 grams", fmt(inrPer10g, 0)],
                      ["1 Tola (11.66g)", fmt(inrPerTola, 0)],
                      ["1 Troy oz", fmt(inrPerTroyOz, 0)],
                      ["100 grams", fmt(inrPerGram * 100, 0)],
                    ]
                  : [
                      ["100 grams", fmt(inrPerGram * 100, 0)],
                      ["1 Troy oz", fmt(inrPerTroyOz, 0)],
                      ["500 grams", fmt(inrPerGram * 500, 0)],
                      ["1 Kg", fmt(inrPerKg, 0)],
                    ]
                ).map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-border/30 bg-card/40 px-3 py-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">₹{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* World USD card */}
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">International</span>
                <p className="text-lg font-bold mt-0.5">$ USD Prices</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-400">$</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl bg-blue-500/10 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted">Per troy oz</span>
                <span className="text-lg font-bold tabular-nums text-blue-400">${fmtUsd(usdPerOz, 2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  ["Per gram",   `$${fmtUsd(usdPerGram, 3)}`],
                  ["Per kg",     `$${fmtUsd(usdPerKg, 0)}`],
                  ["USD/INR fx", `₹${fmt(currentUsdInr, 2)}`],
                  isGold
                    ? ["1 yr ago ~", `$${fmtUsd(METAL_TREND[METAL_TREND.length - 13].gold, 0)}/oz`]
                    : ["1 yr ago ~", `$${fmtUsd(METAL_TREND[METAL_TREND.length - 13].silver, 2)}/oz`],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-border/30 bg-card/40 px-3 py-2.5">
                    <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 18-month change pill */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${trendUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              <TrendingUp className={`h-3 w-3 ${!trendUp ? "rotate-180" : ""}`} />
              {trendUp ? "+" : ""}{trendPct.toFixed(1)}% over 18 months
            </div>
          </div>
        </div>

        {/* ── Trend Chart ───────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${accentBorder} bg-card/50 p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">{isGold ? "Gold" : "Silver"} Price Trend — International</h3>
              <p className="text-xs text-muted mt-0.5">Sep 2024 – Mar 2026 · USD per troy oz · Hover to inspect</p>
            </div>
            <span className={`text-xs font-mono font-semibold ${accentColor}`}>
              ${fmtUsd(usdPerOz)} / oz
            </span>
          </div>

          <TrendChart
            data={METAL_TREND}
            field={metal}
            color={chartColor}
            prefix="$"
          />

          <p className="text-[10px] text-muted/60 text-center">
            Approximate monthly average spot prices · Source: public market data
          </p>
        </div>

        {/* ── Context / quick facts ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "Why prices differ",
              body: "India prices include 10% import duty + 3% GST on top of the international spot rate, plus INR/USD conversion — that's why ₹ prices often look higher than raw USD conversion.",
            },
            {
              title: isGold ? "Gold purity" : "Silver purity",
              body: isGold
                ? "24K is 99.9% pure (investment/bullion). 22K (91.6% pure) is common for jewellery. 18K is used in diamond jewellery. Hallmarked BIS jewellery is mandatory in India since 2021."
                : "999 fine silver is 99.9% pure (coins/bars). 925 sterling silver (92.5%) is used for jewellery. Silver ETFs and SGBs track 999 prices.",
            },
            {
              title: "Price drivers",
              body: isGold
                ? "Gold moves with USD strength, US real interest rates, central bank purchases, geopolitical risk, and inflation expectations. Safe-haven demand spikes in crises."
                : "Silver is both a precious and industrial metal (~60% demand is industrial: solar panels, EVs, electronics). This makes it more volatile than gold.",
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl border border-border/40 bg-card/40 px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className={`h-3.5 w-3.5 ${accentColor} shrink-0`} />
                <span className="text-xs font-semibold">{title}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Data disclaimer */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3.5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Prices are indicative.</span>{" "}
            {liveStatus === "live" && live
              ? <><strong className="text-green-400">Live prices active</strong> — auto-refreshes hourly via GoldAPI.
                {" "}Last fetched: {new Date(live.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.
              </>
              : <>Data was last updated on <strong className="text-foreground">{DATA_DATE}</strong>.</>
            }
            {" "}Live spot prices fluctuate continuously — check{" "}
            <a href="https://www.mcxindia.com" target="_blank" rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5">
              MCX India <ExternalLink className="h-2.5 w-2.5" />
            </a>{" "}
            or{" "}
            <a href="https://goldprice.org" target="_blank" rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5">
              goldprice.org <ExternalLink className="h-2.5 w-2.5" />
            </a>{" "}
            for live rates. Jewellery prices additionally include making charges.
          </p>
        </div>

        <p className="text-center text-xs text-muted pb-4">
          Prices updated periodically based on international spot markets.{" "}
          <span className="text-foreground/40">
            {liveStatus === "live" && live
              ? `Live · fetched ${new Date(live.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : `Data refreshed: ${DATA_DATE}`}
          </span>
        </p>
      </main>
    </div>
  );
}
