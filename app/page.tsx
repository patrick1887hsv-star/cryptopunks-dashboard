import Link from "next/link";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { FloorPriceChart } from "@/components/dashboard/FloorPriceChart";
import { SalesVolumeChart } from "@/components/dashboard/SalesVolumeChart";
import { WalletMovementsChart } from "@/components/dashboard/WalletMovementsChart";
import { JudgementsSection } from "@/components/judgements/JudgementsSection";
import { PredictionsSection } from "@/components/predictions/PredictionsSection";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { timeAgo } from "@/lib/utils/formatters";
import { prisma } from "@/lib/db/client";
import { computeJudgements } from "@/lib/analysis/judgements";
import { computePredictions } from "@/lib/analysis/predictions";

export const revalidate = 300; // revalidate every 5 minutes

async function getSnapshot() {
  try {
    return await prisma.dailySnapshot.findFirst({
      orderBy: { scrapedAt: "desc" },
      include: {
        sales: { orderBy: { soldAt: "desc" }, take: 20 },
        listings: { orderBy: { askPriceEth: "asc" }, take: 20 },
      },
    });
  } catch {
    return null;
  }
}

async function getHistory() {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    return await prisma.dailySnapshot.findMany({
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
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [snapshot, history, judgements, predictions] = await Promise.all([
    getSnapshot(),
    getHistory(),
    computeJudgements().catch(() => null),
    computePredictions().catch(() => []),
  ]);

  const lastUpdated = snapshot?.scrapedAt ? timeAgo(snapshot.scrapedAt) : "never";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                CryptoPunks Analytics
              </h1>
              <p className="text-xs text-gray-500">
                0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB · Ethereum Mainnet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/whales"
              className="hidden text-sm text-gray-400 hover:text-white sm:block"
            >
              🐋 Whale Tracker
            </Link>
            <Link
              href="/whales/changes"
              className="hidden text-sm text-gray-400 hover:text-white sm:block"
            >
              🔔 24h Changes
            </Link>
            <span className="hidden text-xs text-gray-500 sm:block">
              Last updated: <span className="text-gray-300">{lastUpdated}</span>
            </span>
            <RefreshButton />
          </div>
        </div>
      </header>

      {/* No data banner */}
      {!snapshot && (
        <div className="border-b border-yellow-800/50 bg-yellow-900/20 px-4 py-3 text-center text-sm text-yellow-400">
          No data yet. Visit{" "}
          <a
            href="/api/scrape/trigger?secret=local-dev-secret"
            className="underline hover:text-yellow-300"
          >
            /api/scrape/trigger?secret=local-dev-secret
          </a>{" "}
          to trigger a scrape, or wait for the daily 02:00 AM scheduler.
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
        {/* KPI Grid */}
        <section>
          <KpiGrid snapshot={snapshot} />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FloorPriceChart data={history} />
          <SalesVolumeChart data={history} />
        </section>

        <section>
          <WalletMovementsChart data={history} />
        </section>

        {/* Judgements */}
        <JudgementsSection data={judgements} />

        {/* Predictions */}
        <PredictionsSection wallets={predictions} />
      </main>

      <footer className="border-t border-gray-800 px-4 py-6 text-center text-xs text-gray-600">
        CryptoPunks Analytics · Data from nftpricefloor.com &amp; cryptopunks.app ·
        Scraped daily at 02:00 AM ·{" "}
        <a
          href="/api/scrape/trigger?secret=local-dev-secret"
          className="hover:text-gray-400"
        >
          [Trigger Scrape]
        </a>
      </footer>
    </div>
  );
}
