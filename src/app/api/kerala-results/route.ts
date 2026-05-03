import { NextResponse } from "next/server";
import { CONSTITUENCIES } from "@/app/apps/kerala-results/data/constituencies";
import type { ElectionData, ConstituencyResult, Alliance, AllianceTally, PartyTally } from "@/app/apps/kerala-results/data/types";
import { ALLIANCE_META, PARTY_ALLIANCE } from "@/app/apps/kerala-results/data/types";

// ── Persistent Cache (Last Known Good Data) ──────────────────────────────────
let lastSuccessfulData: ElectionData | null = null;
let lastSuccessfulFetchTime = 0;
const CACHE_TTL = 120_000; // 2 minutes

// ── ECI & Mirror Endpoints ────────────────────────────────────────────────────
const ENDPOINTS = [
  "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S12.htm",
  "https://results.eci.gov.in/AcResultGenMay2026/partywiseresult-S12.htm",
];

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchAndParseECI(): Promise<ConstituencyResult[] | null> {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  try {
    const res = await fetch(endpoint, { headers: BROWSER_HEADERS, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes("Election Commission of India")) return null;
    return null; // Simulated failure for fallback demo
  } catch (err) {
    return null;
  }
}

function buildSummary(results: ConstituencyResult[]) {
  const tallies: Record<Alliance, { won: number; leading: number }> = {
    LDF: { won: 0, leading: 0 },
    UDF: { won: 0, leading: 0 },
    NDA: { won: 0, leading: 0 },
    OTH: { won: 0, leading: 0 },
  };

  const partyMap: Record<string, PartyTally> = {};

  let declared = 0;
  let counting = 0;
  let notStarted = 0;

  for (const r of results) {
    if (r.status === "result_declared") declared++;
    else if (r.status === "counting") counting++;
    else notStarted++;

    const leader = r.candidates.find((c) => c.isLeading || c.isWinner);
    if (leader) {
      // Alliance Tally
      if (leader.isWinner) tallies[leader.alliance].won++;
      else if (leader.isLeading) tallies[leader.alliance].leading++;

      // Individual Party Tally
      if (!partyMap[leader.party]) {
        partyMap[leader.party] = {
          party: leader.party,
          alliance: leader.alliance,
          won: 0,
          leading: 0,
          total: 0,
        };
      }
      if (leader.isWinner) partyMap[leader.party].won++;
      else if (leader.isLeading) partyMap[leader.party].leading++;
      partyMap[leader.party].total++;
    }
  }

  const allianceTallies: AllianceTally[] = (["LDF", "UDF", "NDA", "OTH"] as Alliance[]).map(
    (a) => ({
      alliance: a,
      label: ALLIANCE_META[a].label,
      won: tallies[a].won,
      leading: tallies[a].leading,
      total: tallies[a].won + tallies[a].leading,
      color: ALLIANCE_META[a].color,
      bgColor: ALLIANCE_META[a].bgColor,
      borderColor: ALLIANCE_META[a].borderColor,
      textColor: ALLIANCE_META[a].textColor,
      parties: ALLIANCE_META[a].parties,
    })
  );

  const partyTallies = Object.values(partyMap).sort((a, b) => b.total - a.total);

  return {
    totalSeats: 140,
    majorityMark: 71,
    declared,
    counting,
    notStarted,
    tallies: allianceTallies,
    partyTallies,
    lastUpdated: new Date().toISOString(),
  };
}

const INITIAL_RESULTS: ConstituencyResult[] = CONSTITUENCIES.map(c => ({
  id: c.id,
  name: c.name,
  district: c.district,
  candidates: [],
  status: "not_started",
  totalVotes: 0,
  roundsCompleted: 0,
  totalRounds: 20,
  margin: 0,
  lastUpdated: new Date().toISOString(),
  prevWinner: c.prevWinner,
  prevWinnerParty: "Unknown", // Would be populated in real data
}));

export async function GET() {
  const now = Date.now();
  if (now - lastSuccessfulFetchTime > CACHE_TTL) {
    const freshResults = await fetchAndParseECI();
    if (freshResults) {
      const summary = buildSummary(freshResults);
      lastSuccessfulData = { summary, results: freshResults, dataSource: "live", fetchedAt: new Date().toISOString(), isFallback: false };
      lastSuccessfulFetchTime = now;
    }
  }

  if (lastSuccessfulData) {
    const isActuallyOld = now - lastSuccessfulFetchTime > 300_000;
    return NextResponse.json({ ...lastSuccessfulData, isFallback: isActuallyOld });
  }

  return NextResponse.json({
    summary: buildSummary(INITIAL_RESULTS),
    results: INITIAL_RESULTS,
    dataSource: "cached",
    fetchedAt: new Date().toISOString(),
    isFallback: true,
  });
}
