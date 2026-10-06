import { prisma } from "@/lib/db/client";
import { scrapeNftPriceFloor } from "./nftpricefloor";
import { scrapeCryptoPunksApp } from "./cryptopunks-app";
import { scrapeWhaleWallets } from "./whales";
import type { MergedScrapedData, RawSale, RawListing } from "./types";

const WHALE_THRESHOLD_ETH = 30;

export async function runDailyScrape(): Promise<void> {
  console.log(`[scraper] Starting daily scrape at ${new Date().toISOString()}`);

  const [nftFloorResult, cryptoPunksResult] = await Promise.allSettled([
    scrapeNftPriceFloor(),
    scrapeCryptoPunksApp(),
  ]);

  if (nftFloorResult.status === "rejected") {
    console.error("[scraper] nftpricefloor failed:", nftFloorResult.reason);
  }
  if (cryptoPunksResult.status === "rejected") {
    console.error("[scraper] cryptopunks-app failed:", cryptoPunksResult.reason);
  }

  const nftFloor =
    nftFloorResult.status === "fulfilled" ? nftFloorResult.value : null;
  const cryptoPunks =
    cryptoPunksResult.status === "fulfilled" ? cryptoPunksResult.value : null;

  if (!nftFloor && !cryptoPunks) {
    console.error("[scraper] Both scrapers failed. Aborting.");
    return;
  }

  const merged = mergeScrapedData(nftFloor, cryptoPunks);

  const snapshot = await prisma.dailySnapshot.create({
    data: merged.snapshot,
  });

  if (merged.sales.length > 0) {
    // Filter out duplicate txHashes that may already exist in DB
    const existingHashes = await prisma.sale
      .findMany({
        where: {
          txHash: {
            in: merged.sales
              .map((s) => s.txHash)
              .filter((h): h is string => !!h),
          },
        },
        select: { txHash: true },
      })
      .then((rows) => new Set(rows.map((r) => r.txHash)));

    const newSales = merged.sales.filter(
      (s) => !s.txHash || !existingHashes.has(s.txHash)
    );

    if (newSales.length > 0) {
      await prisma.sale.createMany({
        data: newSales.map((s) => ({ ...s, snapshotId: snapshot.id })),
        skipDuplicates: true,
      });
    }
  }

  if (merged.listings.length > 0) {
    await prisma.listing.createMany({
      data: merged.listings.map((l) => ({ ...l, snapshotId: snapshot.id })),
    });
  }

  await recomputeWalletStats();

  await scrapeWhaleWallets().catch((err) =>
    console.error("[scraper] whale scrape failed:", err)
  );

  console.log(
    `[scraper] Done. Snapshot #${snapshot.id}. ${merged.sales.length} sales, ${merged.listings.length} listings.`
  );
}

function mergeScrapedData(
  nftFloor: Awaited<ReturnType<typeof scrapeNftPriceFloor>> | null,
  cryptoPunks: Awaited<ReturnType<typeof scrapeCryptoPunksApp>> | null
): MergedScrapedData {
  // Prefer nftpricefloor for price/stats, cryptopunks.app for wallet data
  const floorPriceEth =
    nftFloor?.floorPriceEth ?? cryptoPunks?.floorPriceEth ?? 0;

  const allSales: RawSale[] = [
    ...(nftFloor?.recentSales ?? []),
    ...(cryptoPunks?.recentSales ?? []),
  ];

  // Deduplicate by txHash
  const seenTxHashes = new Set<string>();
  const uniqueSales: RawSale[] = [];
  for (const sale of allSales) {
    if (sale.txHash) {
      if (seenTxHashes.has(sale.txHash)) continue;
      seenTxHashes.add(sale.txHash);
    }
    uniqueSales.push(sale);
  }

  const allListings: RawListing[] = [
    ...(cryptoPunks?.activeListings ?? []),
    ...(nftFloor?.newListings ?? []),
  ];

  // Whale analysis
  const whaleSales = uniqueSales.filter((s) => s.priceEth >= WHALE_THRESHOLD_ETH);

  // Wallet analysis
  const buyers = new Set(uniqueSales.map((s) => s.buyerAddress).filter(Boolean));
  const sellers = new Set(uniqueSales.map((s) => s.sellerAddress).filter(Boolean));
  const allWallets = new Set([...buyers, ...sellers]);

  return {
    snapshot: {
      floorPriceEth,
      floorPriceUsd: nftFloor?.floorPriceUsd,
      floorPriceChange24h: nftFloor?.floorPriceChange24h,
      totalForSale: cryptoPunks?.totalForSale ?? (allListings.length > 0 ? allListings.length : undefined),
      sales24h: nftFloor?.sales24h ?? (uniqueSales.length > 0 ? uniqueSales.length : undefined),
      salesVolumeEth24h: nftFloor?.salesVolumeEth24h,
      avgSalePriceEth24h: nftFloor?.avgSalePriceEth24h,
      totalOwners: nftFloor?.totalOwners,
      whaleSales24h: whaleSales.length || undefined,
      whaleVolumeEth24h:
        whaleSales.length > 0
          ? whaleSales.reduce((sum, s) => sum + s.priceEth, 0)
          : undefined,
      uniqueBuyers24h: buyers.size || undefined,
      uniqueSellers24h: sellers.size || undefined,
      walletMovements24h: allWallets.size || undefined,
    },
    sales: uniqueSales,
    listings: allListings,
  };
}

export async function recomputeWalletStats(): Promise<void> {
  // Aggregate all sales by wallet address
  const allSales = await prisma.sale.findMany({
    select: {
      buyerAddress: true,
      sellerAddress: true,
      priceEth: true,
      soldAt: true,
    },
    where: {
      OR: [
        { buyerAddress: { not: null } },
        { sellerAddress: { not: null } },
      ],
    },
  });

  // Build wallet aggregates
  const walletMap = new Map<
    string,
    {
      totalBuys: number;
      totalSells: number;
      totalBuyVolumeEth: number;
      totalSellVolumeEth: number;
      txDates: Date[];
    }
  >();

  for (const sale of allSales) {
    if (sale.buyerAddress) {
      const w = walletMap.get(sale.buyerAddress) ?? {
        totalBuys: 0,
        totalSells: 0,
        totalBuyVolumeEth: 0,
        totalSellVolumeEth: 0,
        txDates: [],
      };
      w.totalBuys++;
      w.totalBuyVolumeEth += sale.priceEth;
      if (sale.soldAt) w.txDates.push(sale.soldAt);
      walletMap.set(sale.buyerAddress, w);
    }

    if (sale.sellerAddress) {
      const w = walletMap.get(sale.sellerAddress) ?? {
        totalBuys: 0,
        totalSells: 0,
        totalBuyVolumeEth: 0,
        totalSellVolumeEth: 0,
        txDates: [],
      };
      w.totalSells++;
      w.totalSellVolumeEth += sale.priceEth;
      if (sale.soldAt) w.txDates.push(sale.soldAt);
      walletMap.set(sale.sellerAddress, w);
    }
  }

  const now = new Date();

  // Upsert in batches
  const addresses = Array.from(walletMap.entries());
  const BATCH_SIZE = 100;

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(([address, stats]) => {
        const totalTransactions = stats.totalBuys + stats.totalSells;
        const sortedDates = stats.txDates.sort((a, b) => a.getTime() - b.getTime());
        const firstSeenAt = sortedDates[0] ?? null;
        const lastTxAt = sortedDates[sortedDates.length - 1] ?? null;

        const daysSinceLastTx = lastTxAt
          ? Math.floor((now.getTime() - lastTxAt.getTime()) / 86400000)
          : null;

        // Compute average days between transactions
        let avgDaysBetweenTx: number | null = null;
        if (sortedDates.length >= 2) {
          const intervals: number[] = [];
          for (let j = 1; j < sortedDates.length; j++) {
            const diff =
              (sortedDates[j].getTime() - sortedDates[j - 1].getTime()) /
              86400000;
            intervals.push(diff);
          }
          avgDaysBetweenTx =
            intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }

        return prisma.walletStat.upsert({
          where: { address },
          create: {
            address,
            totalBuys: stats.totalBuys,
            totalSells: stats.totalSells,
            totalTransactions,
            totalBuyVolumeEth: stats.totalBuyVolumeEth,
            totalSellVolumeEth: stats.totalSellVolumeEth,
            firstSeenAt,
            lastSeenAt: lastTxAt,
            avgDaysBetweenTx,
            lastTxAt,
            daysSinceLastTx,
          },
          update: {
            totalBuys: stats.totalBuys,
            totalSells: stats.totalSells,
            totalTransactions,
            totalBuyVolumeEth: stats.totalBuyVolumeEth,
            totalSellVolumeEth: stats.totalSellVolumeEth,
            firstSeenAt,
            lastSeenAt: lastTxAt,
            avgDaysBetweenTx,
            lastTxAt,
            daysSinceLastTx,
          },
        });
      })
    );
  }

  console.log(`[wallet-stats] Recomputed stats for ${walletMap.size} wallets.`);
}
