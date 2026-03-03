import { NextRequest, NextResponse } from "next/server";

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const APP_SLUGS = [
  "qr-generator",
  "image-compressor",
  "markdown-editor",
  "color-palette",
  "password-generator",
  "unit-converter",
  "text-diff",
  "currency-converter",
  "fuel-prices",
];

async function upstash(path: string) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  const res = await fetch(`${UPSTASH_URL}${path}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

/* GET /api/track — return all counts as { slug: count } */
export async function GET() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    // Return zeros when Redis is not configured
    const zeros: Record<string, number> = {};
    APP_SLUGS.forEach((s) => (zeros[s] = 0));
    return NextResponse.json(zeros);
  }

  try {
    const keys = APP_SLUGS.map((s) => `visits:${s}`).join("/");
    const data = await upstash(`/mget/${keys}`);
    const counts: Record<string, number> = {};
    APP_SLUGS.forEach((s, i) => {
      counts[s] = parseInt(data?.result?.[i] ?? "0", 10) || 0;
    });
    return NextResponse.json(counts);
  } catch {
    const zeros: Record<string, number> = {};
    APP_SLUGS.forEach((s) => (zeros[s] = 0));
    return NextResponse.json(zeros);
  }
}

/* POST /api/track?app=qr-generator — increment visit count */
export async function POST(req: NextRequest) {
  const app = req.nextUrl.searchParams.get("app");
  if (!app || !APP_SLUGS.includes(app)) {
    return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  }

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const data = await upstash(`/incr/visits:${app}`);
    return NextResponse.json({ count: data?.result ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
