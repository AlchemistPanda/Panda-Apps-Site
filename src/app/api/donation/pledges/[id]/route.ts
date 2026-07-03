import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";
import { Pledge } from "@/app/donation/lib/types";

export const dynamic = "force-dynamic";

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
    
    // Recalculate total quantity
    pledge.totalQuantity = pledge.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

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
