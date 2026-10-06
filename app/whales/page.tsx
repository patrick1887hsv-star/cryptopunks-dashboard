import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { WhaleKpiBar } from "@/components/whales/WhaleKpiBar";
import { WhaleLeaderboard } from "@/components/whales/WhaleLeaderboard";
import { AccumulationChart } from "@/components/whales/AccumulationChart";
import { WhaleTrendBreakdown } from "@/components/whales/WhaleTrendBreakdown";

export const revalidate = 300;

async function getWhales() {
  try {
    return await prisma.whaleWallet.findMany({
      where: { punkCount: { gt: 10 } },
      orderBy: { punkCount: "desc" },
      select: {
        address: true,
        ensName: true,
        punkCount: true,
        forSaleCount: true,
        buys12m: true,
        sells12m: true,
        sent12m: true,
        received12m: true,
        offers12m: true,
        bids12m: true,
        trend: true,
        lastTxAt: true,
      },
    });
  } catch {
    return [];
  }
}

async function getTrends() {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const history = await prisma.whaleHistory.findMany({
      where: { scrapedAt: { gte: since } },
      orderBy: { scrapedAt: "asc" },
      select: { scrapedAt: true, punkCount: true, forSaleCount: true, address: true },
    });

    const dayMap = new Map<
      string,
      { totalPunks: number; forSale: number; whaleCount: Set<string> }
    >();
    for (const row of history) {
      const day = row.scrapedAt.toISOString().slice(0, 10);
      const e = dayMap.get(day) ?? { totalPunks: 0, forSale: 0, whaleCount: new Set() };
      e.totalPunks += row.punkCount;
      e.forSale += row.forSaleCount;
      e.whaleCount.add(row.address);
      dayMap.set(day, e);
    }

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        totalPunks: v.totalPunks,
        forSale: v.forSale,
        whaleCount: v.whaleCount.size,
      }));
  } catch {
    return [];
  }
}

export default async function WhalesPage() {
  const [whales, trends] = await Promise.all([getWhales(), getTrends()]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐋</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Whale Tracker
              </h1>
              <p className="text-xs text-gray-500">
                Wallets holding &gt; 10 CryptoPunks
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white">
              Main Dashboard
            </Link>
            <span className="text-blue-400 font-medium">Whale Tracker</span>
            <Link href="/whales/changes" className="text-gray-400 hover:text-white">
              🔔 24h Changes
            </Link>
          </nav>
        </div>
      </header>

      {/* No data banner */}
      {whales.length === 0 && (
        <div className="border-b border-yellow-800/50 bg-yellow-900/20 px-4 py-3 text-center text-sm text-yellow-400">
          No whale data yet.{" "}
          <a
            href="/api/whales/seed?secret=local-dev-secret"
            className="underline hover:text-yellow-300"
          >
            Trigger full seed scan
          </a>{" "}
          (POST) or run a regular scrape to start collecting data.
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
        {/* KPI Bar */}
        <WhaleKpiBar whales={whales} />

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AccumulationChart trends={trends} />
          <WhaleTrendBreakdown whales={whales} />
        </div>

        {/* Leaderboard */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Whale Leaderboard
          </h2>
          <WhaleLeaderboard whales={whales} />
        </section>
      </main>

      <footer className="border-t border-gray-800 px-4 py-6 text-center text-xs text-gray-600">
        CryptoPunks Whale Tracker · Data from cryptopunks.app · Updated each scrape ·{" "}
        <a
          href="/api/scrape/trigger?secret=local-dev-secret"
          className="hover:text-gray-400"
        >
          [Trigger Scrape]
        </a>
        {" · "}
        <a
          href="/api/whales/seed?secret=local-dev-secret"
          className="hover:text-gray-400"
        >
          [Seed Whales (POST)]
        </a>
      </footer>
    </div>
  );
}
