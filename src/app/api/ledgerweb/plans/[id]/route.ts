import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

// DELETE /api/ledgerweb/plans/[id]
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
    await redisCmd(["DEL", `pandathings:plan:${id}`]);

    // Remove from index list
    await redisCmd(["LREM", "pandathings:plans", "0", id]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
