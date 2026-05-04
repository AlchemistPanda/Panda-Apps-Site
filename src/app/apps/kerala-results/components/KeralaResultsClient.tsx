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
  LayoutGrid,
  List,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { ElectionData, ConstituencyResult, Alliance, District, PartyTally } from "../data/types";
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

function MajorityBar({ data }: { data: ElectionData }) {
  const tallies = data.summary.tallies;
  const ldf = tallies.find(t => t.alliance === "LDF")?.total || 0;
  const udf = tallies.find(t => t.alliance === "UDF")?.total || 0;
  const nda = tallies.find(t => t.alliance === "NDA")?.total || 0;
  const others = tallies.find(t => t.alliance === "OTH")?.total || 0;
  
  const totalSeats = 140;
  const majorityMark = 71;

  return (
    <div className="mb-10 bg-card/20 rounded-2xl p-6 border border-border/40 shadow-sm overflow-hidden">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Majority Tracker</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">{ldf + udf + nda + others}</span>
          <span className="text-xs text-muted-foreground uppercase font-medium">/ {totalSeats} Declared</span>
        </div>
      </div>

      <div className="relative h-6 bg-secondary/50 rounded-full overflow-hidden flex shadow-inner">
        <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(ldf / totalSeats) * 100}%` }}>
          {ldf > 5 && <span className="flex items-center justify-center h-full text-[10px] font-black text-white">{ldf}</span>}
        </div>
        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(udf / totalSeats) * 100}%` }}>
          {udf > 5 && <span className="flex items-center justify-center h-full text-[10px] font-black text-white">{udf}</span>}
        </div>
        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(nda / totalSeats) * 100}%` }}>
          {nda > 5 && <span className="flex items-center justify-center h-full text-[10px] font-black text-white">{nda}</span>}
        </div>
        <div className="h-full bg-gray-500 transition-all duration-1000" style={{ width: `${(others / totalSeats) * 100}%` }}>
          {others > 5 && <span className="flex items-center justify-center h-full text-[10px] font-black text-white">{others}</span>}
        </div>

        <div 
          className="absolute top-0 bottom-0 w-1 bg-white dark:bg-black z-10 flex flex-col items-center"
          style={{ left: `${(majorityMark / totalSeats) * 100}%` }}
        >
          <div className="absolute -top-6 bg-foreground text-background text-[10px] font-black px-1.5 py-0.5 rounded-sm">71</div>
        </div>
      </div>
      <div className="flex justify-between mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm" /> LDF</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-sm" /> UDF</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-sm" /> NDA</span>
        </div>
        <span className="text-accent">Majority: 71</span>
      </div>
    </div>
  );
}

function PartyTallyTable({ tallies }: { tallies: PartyTally[] }) {
  if (tallies.length === 0) return null;
  return (
    <div className="mb-10 bg-card/10 rounded-2xl border border-border/40 overflow-hidden">
      <div className="p-4 bg-secondary/30 border-b border-border/40">
        <h3 className="text-xs font-bold uppercase tracking-widest">Party-wise Seats</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/20 text-muted-foreground font-medium">
              <th className="px-4 py-2">Party</th>
              <th className="px-4 py-2">Alliance</th>
              <th className="px-4 py-2 text-right">Won</th>
              <th className="px-4 py-2 text-right">Lead</th>
              <th className="px-4 py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {tallies.map((pt, i) => (
              <tr key={i} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-2 font-bold">{pt.party}</td>
                <td className="px-4 py-2"><span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${ALLIANCE_META[pt.alliance].bgColor} ${ALLIANCE_META[pt.alliance].textColor}`}>{pt.alliance}</span></td>
                <td className="px-4 py-2 text-right">{pt.won}</td>
                <td className="px-4 py-2 text-right">{pt.leading}</td>
                <td className="px-4 py-2 text-right font-bold text-accent">{pt.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeatCard({ result }: { result: ConstituencyResult }) {
  const leader = result.candidates.find((c) => c.isLeading || c.isWinner);
  const trailing = result.candidates.filter(c => c !== leader).sort((a,b) => b.votes - a.votes)[0];
  const isDeclared = result.status === "result_declared";

  return (
    <div className="flex flex-col rounded-2xl border border-border/40 bg-card/30 overflow-hidden hover:border-accent/30 hover:bg-card/60 transition-all duration-200">
      <div className="p-4 border-b border-border/30 flex justify-between items-start bg-secondary/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">#{result.id}</span>
            <h3 className="font-bold text-lg leading-none">{result.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            <MapPin className="h-3 w-3" />
            {result.district}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {getStatusBadge(result.status)}
          {leader && leader.alliance !== result.prevWinner && result.status !== "not_started" && (
            <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5 animate-bounce">
              <TrendingUp className="h-3 w-3" /> SWING
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center min-h-[130px]">
        {result.status === "not_started" ? (
          <div className="text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
            <Clock className="h-5 w-5 opacity-50" />
            Counting begins 8:00 AM
          </div>
        ) : leader ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isDeclared ? "text-emerald-500" : ALLIANCE_META[leader.alliance].textColor}`}>
                    {leader.name}
                  </span>
                  {isDeclared && <Trophy className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">{leader.party} · {leader.alliance}</div>
              </div>
              <div className="text-right">
                <div className="font-bold font-mono text-base tracking-tighter">{fmt(leader.votes)}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-black">{isDeclared ? "Won" : "Leading"}</div>
              </div>
            </div>

            {trailing && (
              <div className="flex items-center justify-between opacity-60 grayscale hover:grayscale-0 transition-all">
                <div>
                  <div className="text-xs font-medium">{trailing.name}</div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase">{trailing.party} · {trailing.alliance}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">{fmt(trailing.votes)}</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-bold">Trailing</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground">Awaiting trends...</div>
        )}
      </div>

      {result.status !== "not_started" && (
        <div className="bg-black/5 dark:bg-white/5 p-2 px-4 flex justify-between items-center text-[10px] border-t border-border/20">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-bold">2021 Winner</span>
            <span className="font-black text-muted-foreground">{result.prevWinnerParty} ({result.prevWinner})</span>
          </div>
          {leader && trailing && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">Margin</span>
              <span className="font-black font-mono text-accent">{fmt(result.margin)}</span>
            </div>
          )}
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
      setError("Connect error. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredResults = useMemo(() => {
    if (!data) return [];
    return data.results.filter((r) => {
      const sq = searchQuery.toLowerCase();
      const matchesSearch = !sq || r.name.toLowerCase().includes(sq) || r.district.toLowerCase().includes(sq) || r.candidates.some(c => c.name.toLowerCase().includes(sq));
      const matchesDistrict = filterDistrict === "All" || r.district === filterDistrict;
      let matchesAlliance = true;
      if (filterAlliance !== "All") {
        const leader = r.candidates.find(c => c.isLeading || c.isWinner);
        matchesAlliance = leader ? leader.alliance === filterAlliance : false;
      }
      const matchesKeyBattle = !showOnlyKeyBattles || KEY_BATTLES.some(kb => kb.id === r.id);
      return matchesSearch && matchesDistrict && matchesAlliance && matchesKeyBattle;
    });
  }, [data, searchQuery, filterDistrict, filterAlliance, showOnlyKeyBattles]);


  if (loading && !data) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-muted-foreground animate-pulse">Initializing Dashboard...</div>;
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-foreground">← All Apps</Link>
          <div className="flex items-center gap-4">
            <div className={`text-[10px] font-black px-3 py-1 rounded-full border ${data?.isFallback ? "border-amber-500/50 text-amber-500 bg-amber-500/10" : "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"}`}>
              {data?.isFallback ? "OFFLINE / CACHED" : "LIVE FEED"}
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">Kerala Results <span className="text-accent">2026</span></h1>
          <p className="text-muted-foreground font-medium">Live Assembly Election Counting. 140 Seats. Majority mark 71.</p>
        </div>

        {data?.isFallback && (
          <div className="mb-10 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Live feed paused. Showing last verified data as of {new Date(data.fetchedAt).toLocaleTimeString()}.</p>
          </div>
        )}

        {data && <MajorityBar data={data} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data?.summary.tallies.map((tally) => (
              <div key={tally.alliance} className={`p-3 rounded-xl border flex flex-col justify-between ${tally.borderColor} ${tally.bgColor}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/20 ${tally.textColor}`}>{tally.label}</span>
                  {tally.total >= 71 && <Trophy className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-3xl font-black leading-none ${tally.textColor}`}>{tally.total}</span>
                  <span className="text-[9px] font-bold opacity-70 uppercase leading-none tracking-wider">{tally.won} Won · {tally.leading} Lead</span>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
             {data && <PartyTallyTable tallies={data.summary.partyTallies} />}
          </div>
        </div>

        <div className="sticky top-4 z-40 flex flex-wrap gap-4 mb-8 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-border/40 shadow-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-secondary/30 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none border border-border/50" />
          </div>
          <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value as any)} className="bg-secondary/30 rounded-xl px-4 py-2 text-sm border border-border/50">{DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}<option value="All">All Districts</option></select>
          <label className="flex items-center gap-2 text-xs font-black uppercase cursor-pointer hover:bg-secondary/50 p-2 rounded-xl transition-colors">
            <input type="checkbox" checked={showOnlyKeyBattles} onChange={(e) => setShowOnlyKeyBattles(e.target.checked)} className="accent-accent" /> Key Battles
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResults.map(r => <SeatCard key={r.id} result={r} />)}
        </div>
    </div>
  );
}
