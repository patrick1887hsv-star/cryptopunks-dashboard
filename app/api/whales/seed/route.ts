import { NextRequest, NextResponse } from "next/server";
import { seedWhaleWallets } from "@/lib/scraper/whales";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SCRAPE_TRIGGER_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  seedWhaleWallets().catch((err) =>
    console.error("[whales/seed] Background seed error:", err)
  );

  return NextResponse.json({
    message: "Whale seed started in background (~15 min). Check server logs.",
    startedAt: new Date().toISOString(),
  });
}
