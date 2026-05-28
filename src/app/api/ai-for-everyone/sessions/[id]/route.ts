import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Session } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

// GET /api/ai-for-everyone/sessions/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await redisCmd(["GET", `ai4all:session:${id}`]);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const session = JSON.parse(raw as string);
  const regCount = (await redisCmd(["LLEN", `ai4all:registrations:${id}`])) as number ?? 0;
  return NextResponse.json({ ...session, regCount });
}

// PUT /api/ai-for-everyone/sessions/[id]  (admin)
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

// DELETE /api/ai-for-everyone/sessions/[id]  (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // 1. Fetch existing session to archive it
  const raw = await redisCmd(["GET", `ai4all:session:${id}`]);
  if (raw) {
    const existing = JSON.parse(raw as string);
    const updated = {
      ...existing,
      status: "closed",
      isPublished: false,
      isRegistrationOpen: false,
      isArchived: true,
    };
    await redisCmd(["SET", `ai4all:session:${id}`, JSON.stringify(updated)]);
  }

  // 2. Remove from active list
  await redisCmd(["LREM", "ai4all:sessions", "0", id]);

  // 3. Add to archived list
  const archived = (await redisCmd(["LRANGE", "ai4all:archived_sessions", "0", "-1"])) as string[] ?? [];
  if (!archived.includes(id)) {
    await redisCmd(["RPUSH", "ai4all:archived_sessions", id]);
  }

  return NextResponse.json({ ok: true });
}
