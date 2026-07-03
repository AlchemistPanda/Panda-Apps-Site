import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";
import { Pledge } from "@/app/donation/lib/types";

export const dynamic = "force-dynamic";

// GET /api/donation/pledges
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorName = searchParams.get("donorName");

    const ids = ((await redisCmd(["LRANGE", "donation:pledge_ids", "0", "-1"])) as string[]) ?? [];
    const pledges: Pledge[] = [];

    for (const id of ids) {
      const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
      if (raw) {
        const pledge = JSON.parse(raw as string) as Pledge;
        if (!donorName || pledge.donorName.toLowerCase() === donorName.toLowerCase()) {
          pledges.push(pledge);
        }
      }
    }

    // Sort by createdAt descending
    pledges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(pledges);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch pledges" }, { status: 500 });
  }
}

// POST /api/donation/pledges
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.donorName || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid pledge payload" }, { status: 400 });
    }

    const { donorName, items } = body;

    // Check if donorName is in allowed names
    const rawNames = await redisCmd(["GET", "donation:names"]);
    const names = rawNames ? (JSON.parse(rawNames as string) as string[]) : [];
    if (!names.includes(donorName)) {
      return NextResponse.json({ error: "Donor name not registered in name list" }, { status: 400 });
    }

    // Search for existing pledge for this donor to avoid duplicates or update it
    const ids = ((await redisCmd(["LRANGE", "donation:pledge_ids", "0", "-1"])) as string[]) ?? [];
    let existingPledgeId = "";

    for (const id of ids) {
      const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
      if (raw) {
        const p = JSON.parse(raw as string) as Pledge;
        if (p.donorName.toLowerCase() === donorName.toLowerCase()) {
          existingPledgeId = id;
          break;
        }
      }
    }

    const pledgeId = existingPledgeId || `pledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    const now = new Date().toISOString();
    
    // If it's a new pledge, we use the items passed. If updating, we overwrite or append? The user said:
    // "warn before creating a new one (option to update existing)"
    // We will handle the confirmation client-side. If the user confirms, we just overwrite the pledge.
    const pledge: Pledge = {
      id: pledgeId,
      donorName,
      items: items.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        selectedLink: item.selectedLink,
        status: item.status || 'pledged'
      })),
      totalQuantity,
      createdAt: existingPledgeId ? (await getPledgeCreatedAt(existingPledgeId)) || now : now,
      updatedAt: now
    };

    // Save to Redis
    await redisCmd(["SET", `donation:pledge:${pledgeId}`, JSON.stringify(pledge)]);

    // Add to list of pledge IDs if new
    if (!existingPledgeId) {
      await redisCmd(["RPUSH", "donation:pledge_ids", pledgeId]);
    }

    return NextResponse.json({ success: true, pledge });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to submit pledge" }, { status: 500 });
  }
}

async function getPledgeCreatedAt(id: string): Promise<string | null> {
  try {
    const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
    if (raw) {
      const p = JSON.parse(raw as string) as Pledge;
      return p.createdAt;
    }
  } catch {}
  return null;
}
