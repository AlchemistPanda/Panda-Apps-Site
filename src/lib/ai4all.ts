import crypto from "crypto";

// ── Redis helpers ─────────────────────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

// ── Admin token ───────────────────────────────────────────────────────────────

function adminSecret() {
  return process.env.AI4ALL_ADMIN_SECRET ?? "ai4all-default-secret";
}
function adminPass() {
  return process.env.AI4ALL_ADMIN_PASSWORD ?? "admin123";
}

export function generateAdminToken(): string {
  const ts = Date.now().toString();
  const sig = crypto
    .createHmac("sha256", adminSecret())
    .update(`${ts}.${adminPass()}`)
    .digest("hex");
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return false;
    const ts = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age > 24 * 60 * 60 * 1000) return false;
    const expected = crypto
      .createHmac("sha256", adminSecret())
      .update(`${ts}.${adminPass()}`)
      .digest("hex");
    const expBuf = Buffer.from(expected, "hex");
    const sigBuf = Buffer.from(sig, "hex");
    if (expBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expBuf, sigBuf);
  } catch {
    return false;
  }
}

export function getAdminToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppLink {
  name: string;
  url: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  scheduledDate: string | null;
  durationMinutes: number;
  topics: string[];
  isRegistrationOpen: boolean;
  maxParticipants: number | null;
  whatsappLink: string;
  appsToDownload: AppLink[];
  coverImageUrl: string;
  coverGradient: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  sessionId: string;
  name: string;
  phone: string;
  whatsapp: string;
  district?: string;
  locationOther?: string;
  institution?: string;
  whyJoin: string;
  donationStatus: "donated" | "hardship" | "skipped";
  donationAmount?: number;
  financialReason?: string;
  createdAt: string;
}

export interface VoteOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  isApproved: boolean;
  isCustom: boolean;
  submittedBy?: string;
  createdAt: string;
}

// ── Default vote options seed ─────────────────────────────────────────────────

export const DEFAULT_VOTE_OPTIONS: Omit<VoteOption, "id" | "createdAt">[] = [
  {
    label: "Image Generation",
    description: "Create stunning AI images with Midjourney, DALL-E, Canva AI",
    emoji: "🖼️",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "Poster Generation",
    description: "Design professional posters and graphics using AI tools",
    emoji: "🎨",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "Worksheet Generation",
    description: "Create educational worksheets and lesson materials with AI",
    emoji: "📝",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "Video Generation",
    description: "Produce engaging videos using AI video generation tools",
    emoji: "🎥",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "Audio Generation",
    description: "Generate voiceovers, music, and sound effects with AI",
    emoji: "🔊",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "Basics of AI",
    description: "Understanding AI fundamentals and how to use it in education",
    emoji: "🤖",
    isApproved: true,
    isCustom: false,
  },
];
