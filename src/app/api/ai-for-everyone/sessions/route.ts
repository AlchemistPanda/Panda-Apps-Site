import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Session } from "@/lib/ai4all";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/ai-for-everyone/sessions
export async function GET(req: NextRequest) {
  const isAdmin = verifyAdminToken(getAdminToken(req));

  try {
    const ids = (await redisCmd(["LRANGE", "ai4all:sessions", "0", "-1"])) as string[] | null;
    if (!ids || ids.length === 0) return NextResponse.json([]);

    const sessions: Session[] = [];
    for (const id of ids) {
      const raw = await redisCmd(["GET", `ai4all:session:${id}`]);
      if (raw) sessions.push(JSON.parse(raw as string));
    }
    // Sort by scheduledDate ascending, nulls last
    sessions.sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
    // Admin sees all sessions; public sees only published
    return NextResponse.json(isAdmin ? sessions : sessions.filter((s) => s.isPublished));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// POST /api/ai-for-everyone/sessions  (admin only)
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const session: Session = {
      id: crypto.randomUUID(),
      title: body.title ?? "Untitled Session",
      description: body.description ?? "",
      scheduledDate: body.scheduledDate ?? null,
      durationMinutes: body.durationMinutes ?? 90,
      topics: body.topics ?? [],
      isRegistrationOpen: body.isRegistrationOpen ?? false,
      maxParticipants: body.maxParticipants ?? null,
      whatsappLink: body.whatsappLink ?? "",
      appsToDownload: body.appsToDownload ?? [],
      coverImageUrl: body.coverImageUrl ?? "",
      coverGradient: body.coverGradient ?? "from-violet-500 to-purple-600",
      isPublished: body.isPublished ?? true,
      createdAt: new Date().toISOString(),
    };
    await redisCmd(["SET", `ai4all:session:${session.id}`, JSON.stringify(session)]);
    await redisCmd(["RPUSH", "ai4all:sessions", session.id]);
    return NextResponse.json(session, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
