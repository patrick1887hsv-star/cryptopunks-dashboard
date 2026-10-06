import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cryptopunks.app/",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {
    const [whale, liveRes] = await Promise.allSettled([
      prisma.whaleWallet.findUnique({
        where: { address: address.toLowerCase() },
        include: {
          history: {
            orderBy: { scrapedAt: "asc" },
            select: { punkCount: true, forSaleCount: true, scrapedAt: true },
          },
        },
      }),
      fetch(`https://www.cryptopunks.app/api/account/${address}`, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      }),
    ]);

    const dbWhale = whale.status === "fulfilled" ? whale.value : null;

    let liveData: any = null;
    if (liveRes.status === "fulfilled" && liveRes.value.ok) {
      const json = await liveRes.value.json().catch(() => null);
      liveData = json?.data ?? null;
    }

    if (!dbWhale && !liveData) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({ whale: dbWhale, liveData });
  } catch (error) {
    console.error("[/api/whales/[address]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
