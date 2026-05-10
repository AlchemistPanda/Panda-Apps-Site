import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Registration } from "@/lib/ai4all";
import crypto from "crypto";

// GET /api/ai-for-all/registrations  (admin — all registrations)
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const sessionIds: string[] = sessionId
    ? [sessionId]
    : ((await redisCmd(["LRANGE", "ai4all:sessions", "0", "-1"])) as string[]) ?? [];

  const all: Registration[] = [];
  for (const sid of sessionIds) {
    const ids = (await redisCmd(["LRANGE", `ai4all:registrations:${sid}`, "0", "-1"])) as string[] | null;
    if (!ids) continue;
    for (const id of ids) {
      const raw = await redisCmd(["GET", `ai4all:registration:${id}`]);
      if (raw) all.push(JSON.parse(raw as string));
    }
  }
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(all);
}

// POST /api/ai-for-all/registrations  (public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.sessionId || !body.name || !body.phone || !body.whatsapp || !body.whyJoin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check session exists and registration is open
    const rawSession = await redisCmd(["GET", `ai4all:session:${body.sessionId}`]);
    if (!rawSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const session = JSON.parse(rawSession as string);
    if (!session.isRegistrationOpen) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 403 });
    }

    const reg: Registration = {
      id: crypto.randomUUID(),
      sessionId: body.sessionId,
      name: body.name.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp.trim(),
      whyJoin: body.whyJoin.trim(),
      donationStatus: body.donationStatus ?? "skipped",
      donationAmount: body.donationAmount,
      financialReason: body.financialReason?.trim(),
      createdAt: new Date().toISOString(),
    };

    await redisCmd(["SET", `ai4all:registration:${reg.id}`, JSON.stringify(reg)]);
    await redisCmd(["RPUSH", `ai4all:registrations:${body.sessionId}`, reg.id]);
    return NextResponse.json({ id: reg.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
