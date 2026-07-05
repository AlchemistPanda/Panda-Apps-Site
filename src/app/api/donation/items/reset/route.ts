import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === (process.env.DONATION_ADMIN_PASSWORD || "panda@9010");
}

// POST /api/donation/items/reset
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all active item IDs
    const ids = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];

    // Delete individual item detail keys
    for (const id of ids) {
      await redisCmd(["DEL", `donation:item:${id}`]);
    }

    // Delete the ID catalog list
    await redisCmd(["DEL", "donation:item_ids"]);

    return NextResponse.json({ 
      success: true, 
      message: "Stationery catalog has been successfully reset. It will re-seed on next fetch." 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to reset catalog" }, { status: 500 });
  }
}
