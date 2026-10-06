import { prisma } from "@/lib/db/client";

export interface WalletScore {
  address: string;
  score: number;
  likelyAction: "buy" | "sell" | "bid" | "unknown";
  reasoning: string[];
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalBuyVolumeEth: number;
  totalSellVolumeEth: number;
  daysSinceLastTx: number | null;
  avgDaysBetweenTx: number | null;
}

function scoreWallet(
  wallet: {
    address: string;
    totalBuys: number;
    totalSells: number;
    totalTransactions: number;
    totalBuyVolumeEth: number;
    totalSellVolumeEth: number;
    avgDaysBetweenTx: number | null;
    daysSinceLastTx: number | null;
  }
): WalletScore {
  let score = 0;
  const reasons: string[] = [];

  // Factor 1: Overdue for a transaction (40 pts max)
  if (wallet.avgDaysBetweenTx != null && wallet.daysSinceLastTx != null) {
    const overdueRatio = wallet.daysSinceLastTx / Math.max(1, wallet.avgDaysBetweenTx);
    if (overdueRatio >= 1.0) {
      const overdueScore = Math.min(40, overdueRatio * 20);
      score += overdueScore;
      reasons.push(
        `${wallet.daysSinceLastTx}d since last tx (avg: ${wallet.avgDaysBetweenTx.toFixed(1)}d)`
      );
    }
  }

  // Factor 2: High historical activity (30 pts max)
  const activityScore = Math.min(30, wallet.totalTransactions / 2);
  score += activityScore;
  if (wallet.totalTransactions > 10) {
    reasons.push(`${wallet.totalTransactions} historical transactions`);
  }

  // Factor 3: Recency bonus (30 pts max)
  if (wallet.daysSinceLastTx != null && wallet.daysSinceLastTx <= 14) {
    const recencyScore = Math.max(0, 30 - wallet.daysSinceLastTx * 2);
    score += recencyScore;
    reasons.push(`Last active ${wallet.daysSinceLastTx}d ago`);
  }

  // Predict action type
  const buyRatio =
    wallet.totalBuys / Math.max(1, wallet.totalTransactions);
  const likelyAction: WalletScore["likelyAction"] =
    buyRatio > 0.6 ? "buy" : buyRatio < 0.4 ? "sell" : "bid";

  if (reasons.length === 0) {
    reasons.push(`${wallet.totalTransactions} transactions total`);
  }

  return {
    address: wallet.address,
    score: Math.min(100, Math.round(score)),
    likelyAction,
    reasoning: reasons,
    totalTransactions: wallet.totalTransactions,
    totalBuys: wallet.totalBuys,
    totalSells: wallet.totalSells,
    totalBuyVolumeEth: wallet.totalBuyVolumeEth,
    totalSellVolumeEth: wallet.totalSellVolumeEth,
    daysSinceLastTx: wallet.daysSinceLastTx,
    avgDaysBetweenTx: wallet.avgDaysBetweenTx,
  };
}

export async function computePredictions(): Promise<WalletScore[]> {
  // Get top wallets by transaction count (min 2 transactions to have a pattern)
  const wallets = await prisma.walletStat.findMany({
    where: {
      totalTransactions: { gte: 2 },
    },
    orderBy: { totalTransactions: "desc" },
    take: 200,
  });

  const scores = wallets.map((w) =>
    scoreWallet({
      address: w.address,
      totalBuys: w.totalBuys,
      totalSells: w.totalSells,
      totalTransactions: w.totalTransactions,
      totalBuyVolumeEth: w.totalBuyVolumeEth,
      totalSellVolumeEth: w.totalSellVolumeEth,
      avgDaysBetweenTx: w.avgDaysBetweenTx,
      daysSinceLastTx: w.daysSinceLastTx,
    })
  );

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
