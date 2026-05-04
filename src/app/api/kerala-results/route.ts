import { NextResponse } from "next/server";
import { CONSTITUENCIES } from "@/app/apps/kerala-results/data/constituencies";
import type { ElectionData, ConstituencyResult, Alliance, AllianceTally, PartyTally, ResultStatus } from "@/app/apps/kerala-results/data/types";
import { ALLIANCE_META, PARTY_ALLIANCE } from "@/app/apps/kerala-results/data/types";

// ── Persistent Cache (Last Known Good Data) ──────────────────────────────────
let lastSuccessfulData: ElectionData | null = null;
let lastSuccessfulFetchTime = 0;
const CACHE_TTL = 120_000; // 2 minutes

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function parseECIStatewise(html: string): ConstituencyResult[] {
  const results: ConstituencyResult[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
  
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowContent = match[1];
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      // Remove tags and trim
      cells.push(cellMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
    }
    
    // ECI statewise table typically has 8-9 columns
    // 0: Constituency, 1: Const. No, 2: Leading Candidate, 3: Leading Party, 4: Trailing Candidate, 5: Trailing Party, 6: Margin, 7: Status
    if (cells.length >= 8 && cells[0] !== "Constituency" && cells[0] !== "") {
      const constituencyName = cells[0];
      const leaderName = cells[2];
      const leaderParty = cells[3];
      const margin = parseInt(cells[6].replace(/,/g, '')) || 0;
      const statusRaw = cells[7].toLowerCase();
      
      let status: ResultStatus = "not_started";
      if (statusRaw.includes("declared")) status = "result_declared";
      else if (statusRaw.includes("counting")) status = "counting";
      
      // Find alliance
      let alliance: Alliance = "OTH";
      const partyUpper = leaderParty.toUpperCase();
      for (const [party, a] of Object.entries(PARTY_ALLIANCE)) {
        if (partyUpper.includes(party.toUpperCase())) {
          alliance = a;
          break;
        }
      }
      
      results.push({
        id: 0, // Placeholder
        name: constituencyName,
        district: "", // Placeholder
        status,
        margin,
        candidates: leaderName ? [{
          name: leaderName,
          party: leaderParty,
          alliance,
          votes: 0,
          isLeading: status === "counting",
          isWinner: status === "result_declared",
        }] : [],
        totalVotes: 0,
        roundsCompleted: 0,
        totalRounds: 20,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
  return results;
}

async function fetchAndParseECI(): Promise<ConstituencyResult[] | null> {
  // Kerala (S11) results are spread across 7 pages in the statewise view
  const pageNums = [1, 2, 3, 4, 5, 6, 7];
  try {
    const pagesData = await Promise.all(pageNums.map(async (p) => {
      const url = `https://results.eci.gov.in/ResultAcGenMay2026/statewiseS11${p}.htm`;
      try {
        const res = await fetch(url, { 
          headers: BROWSER_HEADERS, 
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return "";
        return await res.text();
      } catch (e) {
        return "";
      }
    }));
    
    const allResultsRaw: ConstituencyResult[] = [];
    for (const html of pagesData) {
      if (html && html.includes("Election Commission of India")) {
        allResultsRaw.push(...parseECIStatewise(html));
      }
    }
    
    if (allResultsRaw.length === 0) return null;
    
    // Map to static CONSTITUENCIES for stability
    return CONSTITUENCIES.map(c => {
      const found = allResultsRaw.find(r => 
        r.name.toUpperCase() === c.name.toUpperCase() || 
        r.name.toUpperCase().includes(c.name.toUpperCase()) ||
        c.name.toUpperCase().includes(r.name.toUpperCase())
      );
      
      if (found) {
        return {
          ...found,
          id: c.id,
          district: c.district,
          prevWinner: c.prevWinner,
        };
      }
      return {
        id: c.id,
        name: c.name,
        district: c.district,
        status: "not_started",
        candidates: [],
        totalVotes: 0,
        roundsCompleted: 0,
        totalRounds: 20,
        margin: 0,
        lastUpdated: new Date().toISOString(),
        prevWinner: c.prevWinner,
      } as ConstituencyResult;
    });
  } catch (err) {
    console.error("ECI Fetch Error:", err);
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
  prevWinnerParty: "Unknown",
}));

export async function GET() {
  const now = Date.now();
  
  // Try to fetch fresh data if cache expired
  if (!lastSuccessfulData || (now - lastSuccessfulFetchTime > CACHE_TTL)) {
    const freshResults = await fetchAndParseECI();
    if (freshResults) {
      const summary = buildSummary(freshResults);
      lastSuccessfulData = { 
        summary, 
        results: freshResults, 
        dataSource: "live", 
        fetchedAt: new Date().toISOString(), 
        isFallback: false 
      };
      lastSuccessfulFetchTime = now;
    }
  }

  if (lastSuccessfulData) {
    const isActuallyOld = now - lastSuccessfulFetchTime > 300_000;
    return NextResponse.json({ ...lastSuccessfulData, isFallback: isActuallyOld });
  }

  // Final fallback to initial empty state if never successfully fetched
  return NextResponse.json({
    summary: buildSummary(INITIAL_RESULTS),
    results: INITIAL_RESULTS,
    dataSource: "cached",
    fetchedAt: new Date().toISOString(),
    isFallback: true,
  });
}
