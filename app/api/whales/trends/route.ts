import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const since = new Date(Date.now() - 30 * 86400000);

    // Aggregate WhaleHistory by day — sum punkCount per day
    const history = await prisma.whaleHistory.findMany({
      where: { scrapedAt: { gte: since } },
      orderBy: { scrapedAt: "asc" },
      select: { scrapedAt: true, punkCount: true, forSaleCount: true, address: true },
    });

    // Group by UTC date string
    const dayMap = new Map<
      string,
      { totalPunks: number; forSale: number; whaleCount: Set<string> }
    >();

    for (const row of history) {
      const day = row.scrapedAt.toISOString().slice(0, 10);
      const existing = dayMap.get(day) ?? {
        totalPunks: 0,
        forSale: 0,
        whaleCount: new Set<string>(),
      };
      existing.totalPunks += row.punkCount;
      existing.forSale += row.forSaleCount;
      existing.whaleCount.add(row.address);
      dayMap.set(day, existing);
    }

    const trends = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        totalPunks: v.totalPunks,
        forSale: v.forSale,
        whaleCount: v.whaleCount.size,
      }));

    return NextResponse.json({ trends });
  } catch (error) {
    console.error("[/api/whales/trends]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
