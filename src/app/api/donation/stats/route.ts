import { NextRequest, NextResponse } from "next/server";
import { redisCmd } from "@/lib/ai4all";
import { Pledge, DonationItem } from "@/app/donation/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch names
    const rawNames = await redisCmd(["GET", "donation:names"]);
    const names = rawNames ? (JSON.parse(rawNames as string) as string[]) : [];
    const totalNamesCount = names.length;

    // 2. Fetch all pledges
    const pledgeIds = ((await redisCmd(["LRANGE", "donation:pledge_ids", "0", "-1"])) as string[]) ?? [];
    const pledges: Pledge[] = [];
    
    // We also track unique names that pledged
    const pledgedNamesSet = new Set<string>();
    let totalItemsPledged = 0;

    for (const id of pledgeIds) {
      const raw = await redisCmd(["GET", `donation:pledge:${id}`]);
      if (raw) {
        const pledge = JSON.parse(raw as string) as Pledge;
        pledges.push(pledge);
        pledgedNamesSet.add(pledge.donorName);
        totalItemsPledged += pledge.totalQuantity;
      }
    }

    const namesPledgedCount = pledgedNamesSet.size;
    const percentagePledged = totalNamesCount > 0 
      ? Math.round((namesPledgedCount / totalNamesCount) * 100) 
      : 0;

    // 3. Fetch item metadata to get goals
    const itemIds = ((await redisCmd(["LRANGE", "donation:item_ids", "0", "-1"])) as string[]) ?? [];
    const itemsMap = new Map<string, DonationItem>();
    
    for (const id of itemIds) {
      const raw = await redisCmd(["GET", `donation:item:${id}`]);
      if (raw) {
        const item = JSON.parse(raw as string) as DonationItem;
        itemsMap.set(item.id, item);
      }
    }

    // 4. Calculate stats per item
    const itemStatsMap: Record<string, {
      itemId: string;
      itemName: string;
      icon: string;
      totalPledged: number;
      pledgeCount: number;
      orderedCount: number;
      deliveredCount: number;
      goalQuantity: number;
    }> = {};

    // Initialize item stats with all enabled items from the catalog
    itemsMap.forEach((item) => {
      if (item.enabled) {
        itemStatsMap[item.id] = {
          itemId: item.id,
          itemName: item.name,
          icon: item.icon,
          totalPledged: 0,
          pledgeCount: 0,
          orderedCount: 0,
          deliveredCount: 0,
          goalQuantity: item.goalQuantity || 0
        };
      }
    });

    // Populate counts from pledges (multiply by packSize for unit-based counting)
    for (const pledge of pledges) {
      for (const pledgeItem of pledge.items) {
        const id = pledgeItem.itemId;
        
        // If the item was disabled or deleted, we still want to track it if it has pledges
        if (!itemStatsMap[id]) {
          const itemMeta = itemsMap.get(id);
          itemStatsMap[id] = {
            itemId: id,
            itemName: pledgeItem.itemName || itemMeta?.name || id,
            icon: itemMeta?.icon || "📦",
            totalPledged: 0,
            pledgeCount: 0,
            orderedCount: 0,
            deliveredCount: 0,
            goalQuantity: itemMeta?.goalQuantity || 0
          };
        }

        const stats = itemStatsMap[id];
        const itemMeta = itemsMap.get(id);
        const packSize = itemMeta?.packSize || 1;
        const unitCount = pledgeItem.quantity * packSize;
        
        stats.totalPledged += unitCount;
        stats.pledgeCount += 1;
        
        if (pledgeItem.status === 'ordered') {
          stats.orderedCount += unitCount;
        } else if (pledgeItem.status === 'delivered') {
          stats.deliveredCount += unitCount;
        }
      }
    }

    return NextResponse.json({
      totalNamesCount,
      namesPledgedCount,
      percentagePledged,
      totalItemsPledged,
      itemStats: Object.values(itemStatsMap)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to calculate stats" }, { status: 500 });
  }
}
