// ── Kerala Election 2026 — Type definitions ────────────────────────────────

export type Alliance = "LDF" | "UDF" | "NDA" | "OTH";

export type ResultStatus = "not_started" | "counting" | "result_declared";

export interface CandidateResult {
  name: string;
  party: string;
  alliance: Alliance;
  votes: number;
  isLeading: boolean;
  isWinner: boolean;
}

export interface ConstituencyResult {
  id: number;
  name: string;
  district: string;
  candidates: CandidateResult[];
  status: ResultStatus;
  totalVotes: number;
  roundsCompleted: number;
  totalRounds: number;
  margin: number;
  lastUpdated: string;
  /** 2021 winner alliance for swing detection */
  prevWinner?: Alliance;
  prevWinnerParty?: string;
}

export interface PartyTally {
  party: string;
  alliance: Alliance;
  won: number;
  leading: number;
  total: number;
}

export interface AllianceTally {
  alliance: Alliance;
  label: string;
  won: number;
  leading: number;
  total: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  parties: string[];
}

export interface OverallSummary {
  totalSeats: number;
  majorityMark: number;
  declared: number;
  counting: number;
  notStarted: number;
  tallies: AllianceTally[];
  partyTallies: PartyTally[];
  lastUpdated: string;
}

export interface ElectionData {
  summary: OverallSummary;
  results: ConstituencyResult[];
  dataSource: "live" | "cached" | "demo";
  fetchedAt: string;
  isFallback?: boolean;
}

// ── Party ↔ Alliance mapping ──────────────────────────────────────────────────

export const PARTY_ALLIANCE: Record<string, Alliance> = {
  // LDF
  "CPI(M)": "LDF",
  "CPIM": "LDF",
  "Communist Party of India  (Marxist)": "LDF",
  "Communist Party of India (Marxist)": "LDF",
  "CPI": "LDF",
  "Communist Party of India": "LDF",
  "KC(M)": "LDF",
  "Kerala Congress (M)": "LDF",
  "NCP": "LDF",
  "Nationalist Congress Party": "LDF",
  "JD(S)": "LDF",
  "Janata Dal (Secular)": "LDF",
  "INL": "LDF",
  "Indian National League": "LDF",
  "RJD": "LDF",
  "Rashtriya Janata Dal": "LDF",
  "Congress (S)": "LDF",
  "JKC": "LDF",
  "Janadhipathiya Kerala Congress": "LDF",
  "LJD": "LDF",
  "Loktantrik Janata Dal": "LDF",
  
  // UDF
  "INC": "UDF",
  "Indian National Congress": "UDF",
  "IUML": "UDF",
  "Indian Union Muslim League": "UDF",
  "KC(J)": "UDF",
  "Kerala Congress (Joseph)": "UDF",
  "KC": "UDF", // Sometimes used for Joseph group
  "Kerala Congress": "UDF",
  "RSP": "UDF",
  "Revolutionary Socialist Party": "UDF",
  "RMPI": "UDF",
  "Revolutionary Marxist Party of India": "UDF",
  "KC(Jacob)": "UDF",
  "CMP": "UDF",
  "Communist Marxist Party": "UDF",
  
  // NDA
  "BJP": "NDA",
  "Bharatiya Janata Party": "NDA",
  "BDJS": "NDA",
  "Bharath Dharma Jana Sena": "NDA",
  "AIADMK": "NDA",
  
  // OTH
  "IND": "OTH",
  "Independent": "OTH",
  "SDPI": "OTH",
  "WPI": "OTH",
  "BSP": "OTH",
};

export const ALLIANCE_META: Record<
  Alliance,
  { label: string; fullName: string; color: string; bgColor: string; borderColor: string; textColor: string; parties: string[] }
> = {
  LDF: {
    label: "LDF",
    fullName: "Left Democratic Front",
    color: "#ef4444",
    bgColor: "bg-red-500/15",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    parties: ["CPI(M)", "CPI", "NCP", "JD(S)", "RSP", "INL", "KTP"],
  },
  UDF: {
    label: "UDF",
    fullName: "United Democratic Front",
    color: "#3b82f6",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    parties: ["INC", "IUML", "KC(M)", "KC(Jacob)", "RSP(B)", "JD(U)"],
  },
  NDA: {
    label: "NDA",
    fullName: "National Democratic Alliance",
    color: "#f59e0b",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    parties: ["BJP", "BDJS", "KKC"],
  },
  OTH: {
    label: "Others",
    fullName: "Others / Independents",
    color: "#6b7280",
    bgColor: "bg-gray-500/15",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    parties: ["IND"],
  },
};

// ── Districts ─────────────────────────────────────────────────────────────────

export const DISTRICTS = [
  "Kasaragod",
  "Kannur",
  "Wayanad",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Thrissur",
  "Ernakulam",
  "Idukki",
  "Kottayam",
  "Alappuzha",
  "Pathanamthitta",
  "Kollam",
  "Thiruvananthapuram",
] as const;

export type District = (typeof DISTRICTS)[number];
