import { NextResponse } from "next/server";
import { CONSTITUENCIES, KEY_BATTLES } from "@/app/apps/kerala-results/data/constituencies";
import type { ElectionData, ConstituencyResult, Alliance, AllianceTally, CandidateResult } from "@/app/apps/kerala-results/data/types";
import { ALLIANCE_META } from "@/app/apps/kerala-results/data/types";

// ── Cache layer ───────────────────────────────────────────────────────────────
let cachedData: ElectionData | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 60 seconds

// ── ECI endpoints to try (reverse-engineered patterns from past elections) ────
const ECI_ENDPOINTS = [
  "https://results.eci.gov.in/AcResultBye498/partywiseresult-S12.htm",
  "https://results.eci.gov.in/AcResultGenMay2026/partywiseresult-S12.htm",
  "https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S12.htm",
  "https://results.eci.gov.in/AcResultGen2026/partywiseresult-S12.htm",
];

const ECI_CONSTITUENCY_PATTERNS = [
  "https://results.eci.gov.in/AcResultGenMay2026/candidateswise-S12",
  "https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S12",
];

// ── Fetch from ECI (best-effort) ──────────────────────────────────────────────
async function tryFetchECI(): Promise<ConstituencyResult[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  for (const endpoint of ECI_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.ok) {
        // If we get HTML, we'd parse it — but since ECI doesn't expose JSON,
        // this is a best-effort attempt. In production, you'd parse the HTML tables.
        clearTimeout(timeout);
        return null; // HTML parsing would go here
      }
    } catch {
      // Continue to next endpoint
    }
  }

  clearTimeout(timeout);
  return null;
}

// ── Generate demo data (simulated counting in progress) ───────────────────────
function generateDemoData(): ConstituencyResult[] {
  const now = new Date();
  const countingStart = new Date("2026-05-04T08:00:00+05:30");
  const isCountingDay = now >= countingStart;
  
  // If not counting day, show "waiting" state
  if (!isCountingDay) {
    return CONSTITUENCIES.map((c) => ({
      id: c.id,
      name: c.name,
      district: c.district,
      candidates: [],
      status: "not_started" as const,
      totalVotes: 0,
      roundsCompleted: 0,
      totalRounds: 20,
      margin: 0,
      lastUpdated: now.toISOString(),
      prevWinner: c.prevWinner,
    }));
  }

  // Simulate progressive counting
  const hoursElapsed = Math.max(0, (now.getTime() - countingStart.getTime()) / 3_600_000);
  const progressFactor = Math.min(1, hoursElapsed / 8); // Full results in ~8 hours

  const partyNames: Record<Alliance, string[]> = {
    LDF: ["CPI(M)", "CPI", "NCP", "JD(S)", "RSP", "INL"],
    UDF: ["INC", "IUML", "KC(M)", "KC(Jacob)", "RSP(B)"],
    NDA: ["BJP", "BDJS", "KKC"],
    OTH: ["IND", "SDPI", "AAP", "BSP"],
  };

  // Seed-based pseudo-random for consistency
  function seededRandom(seed: number) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }

  return CONSTITUENCIES.map((c) => {
    const rand = seededRandom(c.id * 7919 + 42);
    const seatProgress = Math.min(1, progressFactor + (rand() - 0.5) * 0.3);

    if (seatProgress < 0.05) {
      return {
        id: c.id,
        name: c.name,
        district: c.district,
        candidates: [],
        status: "not_started" as const,
        totalVotes: 0,
        roundsCompleted: 0,
        totalRounds: 20,
        margin: 0,
        lastUpdated: now.toISOString(),
        prevWinner: c.prevWinner,
      };
    }

    const roundsDone = Math.min(20, Math.floor(seatProgress * 20));
    const isDeclared = roundsDone >= 20;

    // Determine likely winner based on constituency history + some randomness
    const swing = rand();
    let winnerAlliance: Alliance;
    if (swing < 0.15) {
      // 15% chance of swing to different alliance
      const alliances: Alliance[] = ["LDF", "UDF", "NDA"];
      winnerAlliance = alliances.filter((a) => a !== c.prevWinner)[Math.floor(rand() * 2)] || "UDF";
    } else {
      winnerAlliance = c.prevWinner;
    }

    const totalVotes = Math.floor(80000 + rand() * 60000);
    const votesCountedRatio = roundsDone / 20;
    const votesCounted = Math.floor(totalVotes * votesCountedRatio);

    // Generate candidates
    const candidates: CandidateResult[] = [];
    const alliances: Alliance[] = ["LDF", "UDF", "NDA", "OTH"];

    let remainingVotes = votesCounted;
    alliances.forEach((alliance, idx) => {
      const isWinnerAlliance = alliance === winnerAlliance;
      let voteShare: number;
      if (isWinnerAlliance) {
        voteShare = 0.35 + rand() * 0.15;
      } else if (idx < 3) {
        voteShare = 0.15 + rand() * 0.15;
      } else {
        voteShare = 0.02 + rand() * 0.05;
      }

      const votes = idx === 3
        ? Math.max(0, remainingVotes)
        : Math.floor(votesCounted * voteShare);
      remainingVotes -= votes;

      const partyList = partyNames[alliance];
      candidates.push({
        name: `Candidate ${c.id}-${idx + 1}`,
        party: partyList[Math.floor(rand() * partyList.length)],
        alliance,
        votes: Math.max(0, votes),
        isLeading: false,
        isWinner: false,
      });
    });

    // Sort by votes and mark leader/winner
    candidates.sort((a, b) => b.votes - a.votes);
    if (candidates.length > 0) {
      if (isDeclared) {
        candidates[0].isWinner = true;
      }
      candidates[0].isLeading = true;
    }

    const margin = candidates.length >= 2 ? candidates[0].votes - candidates[1].votes : 0;

    return {
      id: c.id,
      name: c.name,
      district: c.district,
      candidates,
      status: isDeclared ? ("result_declared" as const) : ("counting" as const),
      totalVotes: votesCounted,
      roundsCompleted: roundsDone,
      totalRounds: 20,
      margin,
      lastUpdated: now.toISOString(),
      prevWinner: c.prevWinner,
    };
  });
}

// ── Build summary from results ────────────────────────────────────────────────
function buildSummary(results: ConstituencyResult[]) {
  const tallies: Record<Alliance, { won: number; leading: number }> = {
    LDF: { won: 0, leading: 0 },
    UDF: { won: 0, leading: 0 },
    NDA: { won: 0, leading: 0 },
    OTH: { won: 0, leading: 0 },
  };

  let declared = 0;
  let counting = 0;
  let notStarted = 0;

  for (const r of results) {
    if (r.status === "result_declared") declared++;
    else if (r.status === "counting") counting++;
    else notStarted++;

    const leader = r.candidates.find((c) => c.isLeading || c.isWinner);
    if (leader) {
      if (leader.isWinner) tallies[leader.alliance].won++;
      else if (leader.isLeading) tallies[leader.alliance].leading++;
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
      parties: ALLIANCE_META[a].parties,
    })
  );

  return {
    totalSeats: 140,
    majorityMark: 71,
    declared,
    counting,
    notStarted,
    tallies: allianceTallies,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const now = Date.now();

  // Return cached if fresh
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Data-Source": cachedData.dataSource,
      },
    });
  }

  // Try ECI first
  let results = await tryFetchECI();
  let dataSource: "live" | "cached" | "demo" = "demo";

  if (!results) {
    // Fallback to demo/simulated data
    results = generateDemoData();
    dataSource = "demo";
  } else {
    dataSource = "live";
  }

  const summary = buildSummary(results);

  const data: ElectionData = {
    summary,
    results,
    dataSource,
    fetchedAt: new Date().toISOString(),
  };

  // Cache
  cachedData = data;
  cacheTime = now;

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-Data-Source": dataSource,
    },
  });
}
