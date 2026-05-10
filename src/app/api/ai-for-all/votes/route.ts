import { NextRequest, NextResponse } from "next/server";
import { redisCmd, DEFAULT_VOTE_OPTIONS, VoteOption } from "@/lib/ai4all";
import crypto from "crypto";

async function ensureSeeded() {
  const ids = await redisCmd(["LRANGE", "ai4all:vote_options", "0", "-1"]);
  if (ids && (ids as string[]).length > 0) return;
  for (const opt of DEFAULT_VOTE_OPTIONS) {
    const option: VoteOption = {
      id: crypto.randomUUID(),
      ...opt,
      createdAt: new Date().toISOString(),
    };
    await redisCmd(["SET", `ai4all:vote_option:${option.id}`, JSON.stringify(option)]);
    await redisCmd(["RPUSH", "ai4all:vote_options", option.id]);
  }
}

// GET /api/ai-for-all/votes?fingerprint=xxx
export async function GET(req: NextRequest) {
  await ensureSeeded();
  const fingerprint = req.nextUrl.searchParams.get("fingerprint") ?? "";
  const ids = (await redisCmd(["LRANGE", "ai4all:vote_options", "0", "-1"])) as string[] | null;
  if (!ids) return NextResponse.json([]);

  const results = [];
  for (const id of ids) {
    const raw = await redisCmd(["GET", `ai4all:vote_option:${id}`]);
    if (!raw) continue;
    const opt: VoteOption = JSON.parse(raw as string);
    if (!opt.isApproved) continue;
    const count = ((await redisCmd(["SCARD", `ai4all:votes:${id}`])) as number) ?? 0;
    const voted = fingerprint
      ? (await redisCmd(["SISMEMBER", `ai4all:votes:${id}`, fingerprint])) === 1
      : false;
    results.push({ ...opt, voteCount: count, userVoted: voted });
  }
  return NextResponse.json(results);
}

// POST /api/ai-for-all/votes  — cast a vote
export async function POST(req: NextRequest) {
  try {
    const { optionId, fingerprint } = await req.json();
    if (!optionId || !fingerprint) {
      return NextResponse.json({ error: "Missing optionId or fingerprint" }, { status: 400 });
    }
    const raw = await redisCmd(["GET", `ai4all:vote_option:${optionId}`]);
    if (!raw) return NextResponse.json({ error: "Option not found" }, { status: 404 });
    const opt: VoteOption = JSON.parse(raw as string);
    if (!opt.isApproved) return NextResponse.json({ error: "Option not approved" }, { status: 403 });

    const added = (await redisCmd(["SADD", `ai4all:votes:${optionId}`, fingerprint])) as number;
    const count = (await redisCmd(["SCARD", `ai4all:votes:${optionId}`])) as number;
    return NextResponse.json({ added: added === 1, count });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
