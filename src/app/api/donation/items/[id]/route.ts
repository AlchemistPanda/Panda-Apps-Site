import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === "panda@9010";
}

// DELETE /api/donation/items/[id]
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

    // Delete item key
    await redisCmd(["DEL", `donation:item:${id}`]);

    // Remove from index list
    await redisCmd(["LREM", "donation:item_ids", "0", id]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// PUT /api/donation/items/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!id || !body) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Update item
    await redisCmd(["SET", `donation:item:${id}`, JSON.stringify({ ...body, id })]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
