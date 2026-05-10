import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Session } from "@/lib/ai4all";

// GET /api/ai-for-all/sessions/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await redisCmd(["GET", `ai4all:session:${id}`]);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(raw as string));
}

// PUT /api/ai-for-all/sessions/[id]  (admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const raw = await redisCmd(["GET", `ai4all:session:${id}`]);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing: Session = JSON.parse(raw as string);
  const body = await req.json();
  const updated: Session = { ...existing, ...body, id, createdAt: existing.createdAt };
  await redisCmd(["SET", `ai4all:session:${id}`, JSON.stringify(updated)]);
  return NextResponse.json(updated);
}

// DELETE /api/ai-for-all/sessions/[id]  (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await redisCmd(["DEL", `ai4all:session:${id}`]);
  await redisCmd(["LREM", "ai4all:sessions", "0", id]);
  return NextResponse.json({ ok: true });
}
