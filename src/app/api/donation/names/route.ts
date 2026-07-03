import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";

export const dynamic = "force-dynamic";

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === "panda@9010";
}

const DEFAULT_NAMES = [
  "Aarav Sharma",
  "Aditi Patel",
  "Ananya Iyer",
  "Arjun Verma",
  "Diya Sen",
  "Ishaan Nair",
  "Kabir Kapoor",
  "Meera Joshi",
  "Rohan Das",
  "Sai Prasad",
  "Tanvi Rao",
  "Vikram Malhotra",
  "Zara Khan",
  "Aaryan Gupta",
  "Sneha Reddy"
];

// GET /api/donation/names
export async function GET(req: NextRequest) {
  try {
    const raw = await redisCmd(["GET", "donation:names"]);
    if (!raw) {
      // Seed default names if empty
      await redisCmd(["SET", "donation:names", JSON.stringify(DEFAULT_NAMES)]);
      return NextResponse.json(DEFAULT_NAMES);
    }
    return NextResponse.json(JSON.parse(raw as string));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch names" }, { status: 500 });
  }
}

// POST /api/donation/names
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { names } = await req.json();
    if (!Array.isArray(names)) {
      return NextResponse.json({ error: "Invalid payload: names must be an array" }, { status: 400 });
    }

    // Clean and de-duplicate names
    const cleanedNames = Array.from(
      new Set(
        names
          .map((n) => typeof n === "string" ? n.trim() : "")
          .filter((n) => n.length > 0)
      )
    ).sort();

    await redisCmd(["SET", "donation:names", JSON.stringify(cleanedNames)]);

    return NextResponse.json({ success: true, count: cleanedNames.length, names: cleanedNames });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save names" }, { status: 500 });
  }
}
