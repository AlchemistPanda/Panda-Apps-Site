import { NextRequest, NextResponse } from "next/server";
import { redisCmd, verifyAdminToken, getAdminToken, Registration } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

// PUT /api/ai-for-everyone/registrations/[id]  (admin — update registration status like screenshot verification)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(getAdminToken(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const raw = await redisCmd(["GET", `ai4all:registration:${id}`]);
    if (!raw) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const existing: Registration = JSON.parse(raw as string);
    const body = await req.json();

    // Only allow admin to update screenshot verification status
    const updated: Registration = {
      ...existing,
      isScreenshotCorrect: typeof body.isScreenshotCorrect === "boolean" ? body.isScreenshotCorrect : existing.isScreenshotCorrect,
    };

    await redisCmd(["SET", `ai4all:registration:${id}`, JSON.stringify(updated)]);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
