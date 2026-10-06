import { prisma } from "@/lib/db/client";

export interface TrendData {
  vs24h: number | null; // % change in sales activity vs 24h ago
  vs7d: number | null;  // % change in sales activity vs 7d ago
  dominantActivity: {
    type: "buy" | "sell" | "neutral";
    buyPercent: number;
    sellPercent: number;
    description: string;
  } | null;
  topWalletsMonth: WalletActivity[];
  topWalletsYear: WalletActivity[];
}

export interface WalletActivity {
  address: string;
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalBuyVolumeEth: number;
  totalSellVolumeEth: number;
}

export async function computeJudgements(): Promise<TrendData> {
  // Fetch last 8 snapshots for trend analysis
  const snapshots = await prisma.dailySnapshot.findMany({
    orderBy: { scrapedAt: "desc" },
    take: 8,
  });

  const today = snapshots[0] ?? null;
  const yesterday = snapshots[1] ?? null;
  const weekAgo = snapshots[7] ?? null;

  // Compute sales activity trends
  let vs24h: number | null = null;
  if (today?.sales24h != null && yesterday?.sales24h != null && yesterday.sales24h > 0) {
    vs24h = ((today.sales24h - yesterday.sales24h) / yesterday.sales24h) * 100;
  }

  let vs7d: number | null = null;
  if (today?.sales24h != null && weekAgo?.sales24h != null && weekAgo.sales24h > 0) {
    vs7d = ((today.sales24h - weekAgo.sales24h) / weekAgo.sales24h) * 100;
  }

  // Dominant activity: compare buy vs sell pressure in today's snapshot
  let dominantActivity: TrendData["dominantActivity"] = null;
  if (today) {
    const buyers = today.uniqueBuyers24h ?? 0;
    const sellers = today.uniqueSellers24h ?? 0;
    const total = buyers + sellers;

    if (total > 0) {
      const buyPercent = Math.round((buyers / total) * 100);
      const sellPercent = 100 - buyPercent;
      const type = buyPercent > 55 ? "buy" : buyPercent < 45 ? "sell" : "neutral";
      const description =
        type === "buy"
          ? `Buy activity dominated — ${buyPercent}% buys vs ${sellPercent}% sells`
          : type === "sell"
          ? `Sell activity dominated — ${sellPercent}% sells vs ${buyPercent}% buys`
          : `Balanced activity — ${buyPercent}% buys vs ${sellPercent}% sells`;

      dominantActivity = { type, buyPercent, sellPercent, description };
    }
  }

  // Top wallets: past month (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const ninetyDaysAgo = new Date(Date.now() - 365 * 86400000);

  const [topWalletsMonth, topWalletsYear] = await Promise.all([
    getTopWallets(thirtyDaysAgo),
    getTopWallets(ninetyDaysAgo),
  ]);

  return { vs24h, vs7d, dominantActivity, topWalletsMonth, topWalletsYear };
}

async function getTopWallets(since: Date): Promise<WalletActivity[]> {
  // Aggregate sales by wallet since a given date
  const sales = await prisma.sale.findMany({
    where: {
      soldAt: { gte: since },
      OR: [
        { buyerAddress: { not: null } },
        { sellerAddress: { not: null } },
      ],
    },
    select: {
      buyerAddress: true,
      sellerAddress: true,
      priceEth: true,
    },
  });

  const walletMap = new Map<
    string,
    { buys: number; sells: number; buyVol: number; sellVol: number }
  >();

  for (const sale of sales) {
    if (sale.buyerAddress) {
      const w = walletMap.get(sale.buyerAddress) ?? { buys: 0, sells: 0, buyVol: 0, sellVol: 0 };
      w.buys++;
      w.buyVol += sale.priceEth;
      walletMap.set(sale.buyerAddress, w);
    }
    if (sale.sellerAddress) {
      const w = walletMap.get(sale.sellerAddress) ?? { buys: 0, sells: 0, buyVol: 0, sellVol: 0 };
      w.sells++;
      w.sellVol += sale.priceEth;
      walletMap.set(sale.sellerAddress, w);
    }
  }

  return Array.from(walletMap.entries())
    .map(([address, stats]) => ({
      address,
      totalTransactions: stats.buys + stats.sells,
      totalBuys: stats.buys,
      totalSells: stats.sells,
      totalBuyVolumeEth: stats.buyVol,
      totalSellVolumeEth: stats.sellVol,
    }))
    .sort((a, b) => b.totalTransactions - a.totalTransactions)
    .slice(0, 10);
}
