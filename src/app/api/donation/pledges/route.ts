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

    // Check if donorName is in allowed names (case-insensitive)
    const rawNames = await redisCmd(["GET", "donation:names"]);
    const names = rawNames ? (JSON.parse(rawNames as string) as string[]) : [];
    const matchedName = names.find(n => n.toLowerCase() === donorName.toLowerCase());
    if (!matchedName) {
      return NextResponse.json({ error: "Donor name not registered in name list" }, { status: 400 });
    }

    const canonicalDonorName = matchedName;

    // Search for existing pledge for this donor to avoid duplicates or update it
    const ids = ((await redisCmd(["LRANGE", "donation:pledge_ids", "0", "-1"])) as string[]) ?? [];
    let existingPledgeId = "";

    for (const id of ids) {
      const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
      if (raw) {
        const p = JSON.parse(raw as string) as Pledge;
        if (p.donorName.toLowerCase() === canonicalDonorName.toLowerCase()) {
          existingPledgeId = id;
          break;
        }
      }
    }

    const pledgeId = existingPledgeId || `pledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Fetch catalog items to calculate unit-based totalQuantity (quantity * packSize)
    const itemIds = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];
    const catalogItems: any[] = [];
    for (const itemId of itemIds) {
      const rawItem = await redisCmd(["GET", `donation:item:${itemId}`]);
      if (rawItem) {
        catalogItems.push(JSON.parse(rawItem as string));
      }
    }

    // Validate items: must have valid itemId, positive quantity, and exist in catalog
    const validatedItems = [];
    for (const item of items) {
      if (!item.itemId || !item.itemName) {
        return NextResponse.json({ error: "Each item must have an itemId and itemName" }, { status: 400 });
      }
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for item '${item.itemName}'` }, { status: 400 });
      }
      const catItem = catalogItems.find((c: any) => c.id === item.itemId);
      if (!catItem) {
        return NextResponse.json({ error: `Item '${item.itemName}' not found in catalog` }, { status: 400 });
      }
      if (!catItem.enabled) {
        return NextResponse.json({ error: `Item '${item.itemName}' is currently disabled` }, { status: 400 });
      }
      validatedItems.push({ ...item, quantity });
    }

    const totalQuantity = validatedItems.reduce((sum: number, item: any) => {
      const catItem = catalogItems.find((c: any) => c.id === item.itemId);
      const packSize = catItem?.packSize || 1;
      return sum + (item.quantity * packSize);
    }, 0);

    const now = new Date().toISOString();
    
    const pledge: Pledge = {
      id: pledgeId,
      donorName: canonicalDonorName,
      items: validatedItems.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
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
