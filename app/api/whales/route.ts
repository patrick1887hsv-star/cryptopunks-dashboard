import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const whales = await prisma.whaleWallet.findMany({
      where: { punkCount: { gt: 10 } },
      orderBy: { punkCount: "desc" },
      include: {
        history: {
          orderBy: { scrapedAt: "desc" },
          take: 1,
        },
      },
    });
    return NextResponse.json({ whales });
  } catch (error) {
    console.error("[/api/whales]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
