import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, VoteOption } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

// PUT /api/ai-for-everyone/votes/options/[id]  (admin — approve/reject/update)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const raw = await redisCmd(["GET", `ai4all:vote_option:${id}`]);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing: VoteOption = JSON.parse(raw as string);
  const body = await req.json();
  const updated: VoteOption = { ...existing, ...body, id };
  await redisCmd(["SET", `ai4all:vote_option:${id}`, JSON.stringify(updated)]);
  return NextResponse.json(updated);
}

// DELETE /api/ai-for-everyone/votes/options/[id]  (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await redisCmd(["DEL", `ai4all:vote_option:${id}`]);
  await redisCmd(["LREM", "ai4all:vote_options", "0", id]);
  await redisCmd(["DEL", `ai4all:votes:${id}`]);
  return NextResponse.json({ ok: true });
}
