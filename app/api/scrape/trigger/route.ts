import { NextRequest, NextResponse } from "next/server";
import { runDailyScrape } from "@/lib/scraper";

function isAuthorized(req: NextRequest): boolean {
  const expectedSecret = process.env.SCRAPE_TRIGGER_SECRET;
  if (!expectedSecret) return false;
  const querySecret = req.nextUrl.searchParams.get("secret");
  if (querySecret === expectedSecret) return true;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${expectedSecret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
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
