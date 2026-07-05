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
    id: "pencil-apsara-20",
    name: "Apsara Platinum Pencils (Box of 20)",
    icon: "✏️",
    enabled: true,
    goalQuantity: 100,
    category: "Writing",
    description: "Apsara Platinum Extra Dark Pencils. Pack of 20 pencils (usually 2 standard boxes of 10 pencils each). Includes 2 erasers and 2 sharpeners.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=Apsara+Platinum+Extra+Dark+Pencils+Pack+of+20", price: 110 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=Apsara+Platinum+Extra+Dark+Pencils+Pack+of+20", price: 100 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "eraser-apsara-20",
    name: "Apsara Non-Dust Erasers (Pack of 20)",
    icon: "🧼",
    enabled: true,
    goalQuantity: 80,
    category: "Writing",
    description: "Apsara Non-Dust Erasers. Pack of 20 erasers. High-quality erasers that leave minimal residue and prevent tearing of paper.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=Apsara+Non+Dust+Erasers+pack+of+20", price: 60 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=Apsara+Non+Dust+Erasers+pack+of+20", price: 55 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "sharpener-apsara-20",
    name: "Apsara Long Point Sharpeners (Pack of 20)",
    icon: "⚙️",
    enabled: true,
    goalQuantity: 80,
    category: "Writing",
    description: "Apsara Long Point Sharpeners. Pack of 20 sharpeners. Scientifically angled blades for clean, sharp pencil points without breaking.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=Apsara+Long+Point+Sharpeners+pack+of+20", price: 70 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=Apsara+Long+Point+Sharpeners+pack+of+20", price: 65 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "sketch-doms-12",
    name: "DOMS Aqua Water Color Pens (Pack of 12)",
    icon: "🖍️",
    enabled: true,
    goalQuantity: 80,
    category: "Art",
    description: "DOMS Aqua Water Color Sketch Pens. Pack of 12 vibrant colors. Non-toxic ink with durable fiber tips for smooth drawing and sketching.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=DOMS+Sketch+Pens+pack+of+12", price: 30 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=DOMS+Sketch+Pens+pack+of+12", price: 25 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "crayons-doms-12",
    name: "DOMS Wax Crayons (Pack of 12)",
    icon: "🎨",
    enabled: true,
    goalQuantity: 80,
    category: "Art",
    description: "DOMS Wax Crayons. Pack of 12 bright colors. Smooth, smudge-free flow, completely non-toxic and child-safe.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=DOMS+Wax+Crayons+pack+of+12", price: 20 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=DOMS+Wax+Crayons+pack+of+12", price: 15 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pencil-apsara-5boxes",
    name: "Apsara Platinum Pencils (5 Boxes Combo)",
    icon: "✏️",
    enabled: true,
    goalQuantity: 50,
    category: "Writing",
    description: "Apsara Platinum Extra Dark Pencils. Combo of 5 boxes (10 pencils per box, total 50 pencils). Includes 5 erasers and 5 sharpeners.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=Apsara+Platinum+Extra+Dark+Pencils+Pack+of+5+boxes", price: 275 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=Apsara+Platinum+Extra+Dark+Pencils+Pack+of+5+boxes", price: 250 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ruler-doms-10",
    name: "DOMS Ruler 15cm (Pack of 10)",
    icon: "📏",
    enabled: true,
    goalQuantity: 80,
    category: "Instruments",
    description: "DOMS Transparent Rulers. Pack of 10 scales (15cm / 6 inch). Durable and clear plastic scales with bold markings.",
    links: [
      { siteName: "Amazon", url: "https://www.amazon.in/s?k=DOMS+ruler+15cm+pack+of+10", price: 50 },
      { siteName: "Flipkart", url: "https://www.flipkart.com/search?q=DOMS+ruler+15cm+pack+of+10", price: 45 }
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
