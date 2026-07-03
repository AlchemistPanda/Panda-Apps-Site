import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.DONATION_ADMIN_PASSWORD || "panda@9010";

// POST /api/donation/auth — verify admin password server-side
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Auth check failed" }, { status: 500 });
  }
}
