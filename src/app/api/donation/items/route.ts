import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";
import { DonationItem } from "@/app/donation/lib/types";

export const dynamic = "force-dynamic";

// Helper to check admin password from headers
function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === (process.env.DONATION_ADMIN_PASSWORD || "panda@9010");
}

// Initial pre-seed items
const DEFAULT_ITEMS: DonationItem[] = [
  {
    id: "notebook-single-line",
    name: "Single Line Notebook (200 pages)",
    icon: "📓",
    enabled: true,
    goalQuantity: 100,
    category: "Books",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=classmate+notebooks+200+pages", price: 45 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=classmate+notebook+200+pages", price: 42 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ball-pen-set",
    name: "Ball Pen Set (Pack of 5)",
    icon: "🖊️",
    enabled: true,
    goalQuantity: 50,
    category: "Writing",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=ball+pen+set+pack+of+5", price: 50 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=ball+pen+set+pack+of+5", price: 48 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pencil-box-set",
    name: "Pencil & Eraser Set",
    icon: "✏️",
    enabled: true,
    goalQuantity: 80,
    category: "Writing",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=apsara+pencil+box", price: 60 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=apsara+pencil+box", price: 55 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "geometry-box",
    name: "Geometry Box",
    icon: "📐",
    enabled: true,
    goalQuantity: 30,
    category: "Instruments",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=camel+geometry+box", price: 120 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=camel+geometry+box", price: 110 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "color-pencils",
    name: "Color Pencil Pack",
    icon: "🎨",
    enabled: true,
    goalQuantity: 40,
    category: "Art",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=doms+color+pencils", price: 100 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=doms+color+pencils", price: 95 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "school-bag",
    name: "School Bag",
    icon: "🎒",
    enabled: true,
    goalQuantity: 20,
    category: "Bags",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=school+bag+kids", price: 399 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=school+bag+kids", price: 380 }
    ],
    createdAt: new Date().toISOString()
  }
];

// GET /api/donation/items
export async function GET(req: NextRequest) {
  try {
    const ids = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];
    
    // Seed default items if the list is empty
    if (ids.length === 0) {
      const now = new Date();
      const itemsToSeed = DEFAULT_ITEMS.map((item, index) => {
        // Stagger by 1 minute for each item to ensure stable and consistent sorting
        const createdDate = new Date(now.getTime() - index * 60 * 1000);
        return {
          ...item,
          createdAt: createdDate.toISOString()
        };
      });
      for (const item of itemsToSeed) {
        await redisCmd(["SET", `donation:item:${item.id}`, JSON.stringify(item)]);
        await redisCmd(["RPUSH", "donation:item_ids", item.id]);
      }
      return NextResponse.json(itemsToSeed);
    }

    const items: DonationItem[] = [];
    for (const id of ids) {
      const raw = await redisCmd(["GET", `donation:item:${id}`]);
      if (raw) {
        items.push(JSON.parse(raw as string));
      }
    }
    
    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch items" }, { status: 500 });
  }
}

// POST /api/donation/items
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await req.json() as DonationItem;
    if (!item || !item.id || !item.name) {
      return NextResponse.json({ error: "Invalid item payload" }, { status: 400 });
    }

    item.createdAt = item.createdAt || new Date().toISOString();
    
    // Save details
    await redisCmd(["SET", `donation:item:${item.id}`, JSON.stringify(item)]);

    // Add to IDs list if not already there
    const ids = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];
    if (!ids.includes(item.id)) {
      await redisCmd(["RPUSH", "donation:item_ids", item.id]);
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create item" }, { status: 500 });
  }
}
