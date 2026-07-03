import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";
import { Pledge, DonationItem } from "@/app/donation/lib/types";

export const dynamic = "force-dynamic";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === (process.env.DONATION_ADMIN_PASSWORD || "panda@9010");
}

// GET /api/donation/pledges/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
    if (!raw) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(raw as string));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/donation/pledges/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
    if (!raw) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    const pledge = JSON.parse(raw as string) as Pledge;
    const body = await req.json();

    if (body.resetAll) {
      // Reset status of all items in this pledge to 'pledged'
      pledge.items = pledge.items.map(item => ({ ...item, status: 'pledged' }));
    } else if (body.itemId && body.status) {
      // Update specific item status
      pledge.items = pledge.items.map(item => 
        item.itemId === body.itemId 
          ? { ...item, status: body.status } 
          : item
      );
    } else if (Array.isArray(body.items)) {
      // Update full items array
      pledge.items = body.items;
    } else {
      return NextResponse.json({ error: "Invalid patch request" }, { status: 400 });
    }

    pledge.updatedAt = new Date().toISOString();
    
    // Recalculate total quantity with packSize from catalog
    const itemIds = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];
    const catalogItems: DonationItem[] = [];
    for (const itemId of itemIds) {
      const rawItem = await redisCmd(["GET", `donation:item:${itemId}`]);
      if (rawItem) {
        catalogItems.push(JSON.parse(rawItem as string));
      }
    }

    pledge.totalQuantity = pledge.items.reduce((sum, item) => {
      const catItem = catalogItems.find(c => c.id === item.itemId);
      const packSize = catItem?.packSize || 1;
      return sum + ((item.quantity || 0) * packSize);
    }, 0);

    // Save to Redis
    await redisCmd(["SET", `donation:pledge:${id}`, JSON.stringify(pledge)]);

    return NextResponse.json({ success: true, pledge });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/donation/pledges/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    // Delete details key
    await redisCmd(["DEL", `donation:pledge:${id}`]);

    // Remove from index list
    await redisCmd(["LREM", "donation:pledge_ids", "0", id]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
