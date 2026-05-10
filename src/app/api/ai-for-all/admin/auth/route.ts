import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/ai4all";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = process.env.AI4ALL_ADMIN_PASSWORD ?? "admin123";
    if (!password || password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const token = generateAdminToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
