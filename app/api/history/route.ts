import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({ days: searchParams.get("days") ?? 30 });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
    }

    const { days } = parsed.data;
    const since = new Date(Date.now() - days * 86400000);

    const snapshots = await prisma.dailySnapshot.findMany({
      where: { scrapedAt: { gte: since } },
      orderBy: { scrapedAt: "asc" },
      select: {
        id: true,
        scrapedAt: true,
        floorPriceEth: true,
        floorPriceUsd: true,
        floorPriceChange24h: true,
        sales24h: true,
        salesVolumeEth24h: true,
        totalForSale: true,
        totalOwners: true,
        walletMovements24h: true,
        uniqueBuyers24h: true,
        uniqueSellers24h: true,
        whaleSales24h: true,
      },
    });

    return NextResponse.json({ snapshots, days });
  } catch (error) {
    console.error("[/api/history]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
