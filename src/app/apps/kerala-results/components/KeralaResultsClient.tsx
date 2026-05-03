"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  TrendingUp,
  Trophy,
  ArrowUp,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { ElectionData, ConstituencyResult, Alliance, District } from "../data/types";
import { ALLIANCE_META, DISTRICTS } from "../data/types";
import { KEY_BATTLES } from "../data/constituencies";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

function getStatusBadge(status: ConstituencyResult["status"]) {
  switch (status) {
    case "not_started":
      return <span className="bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Waiting</span>;
    case "counting":
      return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider animate-pulse">Counting</span>;
    case "result_declared":
      return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Declared</span>;
  }
}

// ── Components ────────────────────────────────────────────────────────────────

function SeatCard({ result }: { result: ConstituencyResult }) {
  const leader = result.candidates.find((c) => c.isLeading || c.isWinner);
  const trailing = result.candidates.filter(c => c !== leader).sort((a,b) => b.votes - a.votes)[0];
  const isDeclared = result.status === "result_declared";

  return (
    <div className="flex flex-col rounded-2xl border border-border/40 bg-card/30 overflow-hidden hover:border-accent/30 hover:bg-card/60 transition-all duration-200">
      <div className="p-4 border-b border-border/30 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">#{result.id}</span>
            <h3 className="font-bold text-lg leading-none">{result.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {result.district}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(result.status)}
          {leader && leader.alliance !== result.prevWinner && result.status !== "not_started" && (
            <span className="text-[10px] font-medium text-amber-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Swing from {result.prevWinner}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center min-h-[120px]">
        {result.status === "not_started" ? (
          <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Clock className="h-5 w-5 opacity-50" />
            Counting begins at 8:00 AM
          </div>
        ) : leader ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isDeclared ? "text-emerald-500" : ALLIANCE_META[leader.alliance].textColor}`}>
                    {leader.name}
                  </span>
                  {isDeclared && <Trophy className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className="text-xs text-muted-foreground">{leader.party} · {leader.alliance}</div>
              </div>
              <div className="text-right">
                <div className="font-bold font-mono">{fmt(leader.votes)}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{isDeclared ? "Won" : "Leading"}</div>
              </div>
            </div>

            {trailing && (
              <div className="flex items-center justify-between opacity-70">
                <div>
                  <div className="text-sm">{trailing.name}</div>
                  <div className="text-[10px] text-muted-foreground">{trailing.party} · {trailing.alliance}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{fmt(trailing.votes)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Trailing</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">Awaiting trends...</div>
        )}
      </div>

      {result.status !== "not_started" && leader && trailing && (
        <div className="bg-black/5 dark:bg-white/5 p-2 px-4 flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <ArrowUp className="h-3 w-3" /> Margin
          </span>
          <span className="font-bold font-mono">{fmt(result.margin)}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function KeralaResultsClient() {
  const [data, setData] = useState<ElectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState<District | "All">("All");
  const [filterAlliance, setFilterAlliance] = useState<Alliance | "All">("All");
  const [showOnlyKeyBattles, setShowOnlyKeyBattles] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/kerala-results");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to live feed. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredResults = useMemo(() => {
    if (!data) return [];
    
    return data.results.filter((r) => {
      // Search
      const sq = searchQuery.toLowerCase();
      const matchesSearch = !sq || 
        r.name.toLowerCase().includes(sq) || 
        r.district.toLowerCase().includes(sq) ||
        r.candidates.some(c => c.name.toLowerCase().includes(sq));

      // District
      const matchesDistrict = filterDistrict === "All" || r.district === filterDistrict;

      // Alliance Leader
      let matchesAlliance = true;
      if (filterAlliance !== "All") {
        const leader = r.candidates.find(c => c.isLeading || c.isWinner);
        matchesAlliance = leader ? leader.alliance === filterAlliance : false;
      }

      // Key Battles
      const matchesKeyBattle = !showOnlyKeyBattles || KEY_BATTLES.some(kb => kb.id === r.id);

      return matchesSearch && matchesDistrict && matchesAlliance && matchesKeyBattle;
    });
  }, [data, searchQuery, filterDistrict, filterAlliance, showOnlyKeyBattles]);


  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Connecting to Election Data Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-7xl">
        {/* ── Top Nav ── */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            All Apps
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
              {data?.isFallback ? (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span> Cached Feed</>
              ) : (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Live ECI Feed</>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              Kerala Election <span className="text-accent">2026</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Live counting updates for all 140 Assembly constituencies. Majority mark: 71.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 text-sm">
            <button 
              onClick={() => { setLoading(true); fetchData(); }}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-full transition-colors border border-border/50 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-accent" : ""}`} />
              Refresh Data
            </button>
            <span className="text-xs text-muted-foreground">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {data?.isFallback && (
          <div className="mb-8 p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Live feed temporarily paused</p>
              <p className="text-xs opacity-90">Official source is currently unavailable due to heavy traffic. Displaying last verified data as of {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ── Summary Cards ── */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {data.summary.tallies.map((tally) => (
              <div 
                key={tally.alliance} 
                className={`relative overflow-hidden rounded-2xl border ${tally.borderColor} ${tally.bgColor} p-5 flex flex-col justify-between min-h-[120px] shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className={`font-black text-2xl ${tally.textColor}`}>{tally.label}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{tally.parties.slice(0,3).join(", ")} {tally.parties.length > 3 && "+"}</p>
                  </div>
                  {tally.total >= data.summary.majorityMark && (
                    <Trophy className={`h-6 w-6 ${tally.textColor} opacity-80`} />
                  )}
                </div>
                
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className={`text-4xl font-black font-mono tracking-tighter ${tally.textColor}`}>
                    {tally.total}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground opacity-80 uppercase leading-tight">Total</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {tally.won} Won · {tally.leading} Lead
                    </span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="absolute bottom-0 left-0 h-1 bg-black/10 dark:bg-white/10 w-full">
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `\${Math.min(100, (tally.total / 140) * 100)}%`,
                      backgroundColor: tally.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest px-2">Constituency Results</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-4 mb-8 bg-card/30 p-4 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search constituency or candidate..."
              className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value as any)}
            className="rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-all min-w-[140px]"
          >
            <option value="All">All Districts</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={filterAlliance}
            onChange={(e) => setFilterAlliance(e.target.value as any)}
            className="rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-all min-w-[140px]"
          >
            <option value="All">All Leaders</option>
            <option value="LDF">Leading: LDF</option>
            <option value="UDF">Leading: UDF</option>
            <option value="NDA">Leading: NDA</option>
            <option value="OTH">Leading: Others</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-border/50">
            <input 
              type="checkbox" 
              checked={showOnlyKeyBattles}
              onChange={(e) => setShowOnlyKeyBattles(e.target.checked)}
              className="rounded text-accent focus:ring-accent accent-accent w-4 h-4"
            />
            <span className="font-medium text-foreground">Key Battles</span>
          </label>
        </div>

        {/* ── Results Grid ── */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-24 bg-card/10 rounded-3xl border border-border/30 border-dashed">
            <div className="text-5xl mb-4 opacity-50">🗳️</div>
            <h3 className="text-lg font-bold text-foreground mb-1">No matches found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => { setSearchQuery(""); setFilterDistrict("All"); setFilterAlliance("All"); setShowOnlyKeyBattles(false); }}
              className="mt-4 text-sm text-accent hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResults.map(r => <SeatCard key={r.id} result={r} />)}
          </div>
        )}

      </div>
    </div>
  );
}
