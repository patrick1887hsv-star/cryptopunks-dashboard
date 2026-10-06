import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const snapshot = await prisma.dailySnapshot.findFirst({
      orderBy: { scrapedAt: "desc" },
      include: {
        sales: {
          orderBy: { soldAt: "desc" },
          take: 50,
        },
        listings: {
          orderBy: { askPriceEth: "asc" },
          take: 50,
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "No data yet. Trigger a scrape first.", snapshot: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("[/api/snapshot]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
