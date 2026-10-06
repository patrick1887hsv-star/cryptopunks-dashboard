import { NextRequest, NextResponse } from "next/server";
import { runDailyScrape } from "@/lib/scraper";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SCRAPE_TRIGGER_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run scrape asynchronously so the request returns immediately
    runDailyScrape().catch((err) =>
      console.error("[scrape/trigger] Background scrape error:", err)
    );

    return NextResponse.json({
      message: "Scrape started in background. Check server logs for progress.",
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[/api/scrape/trigger]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also allow GET for easy browser testing
export async function GET(req: NextRequest) {
  return POST(req);
}
