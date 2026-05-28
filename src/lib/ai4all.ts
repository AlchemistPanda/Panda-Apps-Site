import crypto from "crypto";

// ── Redis helpers ─────────────────────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables. Please check your .env.local file or Vercel environment settings.");
  }
  
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Upstash Redis error (${res.status}): ${text}`);
  }
  
  const data = await res.json();
  if (data.error) {
    throw new Error(`Upstash returned error: ${data.error}`);
  }
  
  return data.result ?? null;
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
  regCount?: number;
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
  screenshotUrl?: string;
  isScreenshotCorrect?: boolean;
  autoVerifiedReason?: string;
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
    label: "AI യുടെ അടിസ്ഥാന കാര്യങ്ങൾ (Basics of AI)",
    description: "AI എന്താണ്, എങ്ങനെ ഉപയോഗിക്കാം — തുടക്കക്കാർക്കുള്ള ഒരു ലളിതമായ ആമുഖം",
    emoji: "🤖",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "ചിത്രങ്ങൾ സൃഷ്ടിക്കൽ (Image Generation)",
    description: "Midjourney, DALL-E, Canva AI ഉപയോഗിച്ച് മനോഹരമായ ചിത്രങ്ങൾ ഉണ്ടാക്കാം",
    emoji: "🖼️",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "പോസ്റ്റർ നിർമ്മാണം (Poster Generation)",
    description: "AI ഉപകരണങ്ങൾ ഉപയോഗിച്ച് പ്രൊഫഷണൽ പോസ്റ്ററുകളും ഗ്രാഫിക്‌സും ഡിസൈൻ ചെയ്യാം",
    emoji: "🎨",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "വർക്ക്ഷീറ്റ് നിർമ്മാണം (Presentation Generation)",
    description: "AI ഉപയോഗിച്ച് പ്രസന്റേഷനുകളും ലേഖനങ്ങളും തയ്യാറാക്കാം",
    emoji: "📝",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "വീഡിയോ നിർമ്മാണം (Video Generation)",
    description: "AI വീഡിയോ ടൂളുകൾ ഉപയോഗിച്ച് ആകർഷകമായ വീഡിയോകൾ ഉണ്ടാക്കാം",
    emoji: "🎥",
    isApproved: true,
    isCustom: false,
  },
  {
    label: "ഓഡിയോ നിർമ്മാണം (Audio Generation)",
    description: "AI ഉപയോഗിച്ച് വോയ്‌സ്‌ഓവർ, സംഗീതം, ശബ്‌ദ ഇഫക്‌ടുകൾ ഉണ്ടാക്കാം",
    emoji: "🔊",
    isApproved: true,
    isCustom: false,
  },
];
