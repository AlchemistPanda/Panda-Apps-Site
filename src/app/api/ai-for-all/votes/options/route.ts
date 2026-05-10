import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, VoteOption } from "@/lib/ai4all";
import crypto from "crypto";

// GET /api/ai-for-all/votes/options  (admin — includes unapproved)
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ids = (await redisCmd(["LRANGE", "ai4all:vote_options", "0", "-1"])) as string[] | null;
  if (!ids) return NextResponse.json([]);

  const results = [];
  for (const id of ids) {
    const raw = await redisCmd(["GET", `ai4all:vote_option:${id}`]);
    if (!raw) continue;
    const opt: VoteOption = JSON.parse(raw as string);
    const count = ((await redisCmd(["SCARD", `ai4all:votes:${id}`])) as number) ?? 0;
    results.push({ ...opt, voteCount: count });
  }
  return NextResponse.json(results);
}

// POST /api/ai-for-all/votes/options  — submit custom suggestion (public)
export async function POST(req: NextRequest) {
  try {
    const { label, description, submittedBy } = await req.json();
    if (!label?.trim()) return NextResponse.json({ error: "Label required" }, { status: 400 });

    const option: VoteOption = {
      id: crypto.randomUUID(),
      label: label.trim().slice(0, 100),
      description: (description ?? "").trim().slice(0, 300),
      emoji: "💡",
      isApproved: false,
      isCustom: true,
      submittedBy: (submittedBy ?? "Anonymous").trim().slice(0, 50),
      createdAt: new Date().toISOString(),
    };
    await redisCmd(["SET", `ai4all:vote_option:${option.id}`, JSON.stringify(option)]);
    await redisCmd(["RPUSH", "ai4all:vote_options", option.id]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
