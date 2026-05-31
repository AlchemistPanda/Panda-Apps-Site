import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

// GET /api/ledgerweb/plans
export async function GET(req: NextRequest) {
  try {
    const ids = ((await redisCmd(["LRANGE", "pandathings:plans", "0", "-1"])) as string[]) ?? [];
    if (ids.length === 0) return NextResponse.json([]);

    const plans = [];
    for (const id of ids) {
      const raw = await redisCmd(["GET", `pandathings:plan:${id}`]);
      if (raw) {
        plans.push(JSON.parse(raw as string));
      }
    }

    // Sort by createdAt descending
    plans.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(plans);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// POST /api/ledgerweb/plans
export async function POST(req: NextRequest) {
  try {
    const plan = await req.json();
    if (!plan || !plan.id) {
      return NextResponse.json({ error: "Invalid plan payload" }, { status: 400 });
    }

    // Save plan details
    await redisCmd(["SET", `pandathings:plan:${plan.id}`, JSON.stringify(plan)]);

    // Check if plan id is already in the list
    const ids = ((await redisCmd(["LRANGE", "pandathings:plans", "0", "-1"])) as string[]) ?? [];
    if (!ids.includes(plan.id)) {
      await redisCmd(["RPUSH", "pandathings:plans", plan.id]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
