"use client";

import { TrendCard } from "./TrendCard";
import { DominantActivityCard } from "./DominantActivityCard";
import { TopWalletsTable } from "./TopWalletsTable";

interface JudgementsData {
  vs24h: number | null;
  vs7d: number | null;
  dominantActivity: {
    type: "buy" | "sell" | "neutral";
    buyPercent: number;
    sellPercent: number;
    description: string;
  } | null;
  topWalletsMonth: {
    address: string;
    totalTransactions: number;
    totalBuys: number;
    totalSells: number;
    totalBuyVolumeEth: number;
    totalSellVolumeEth: number;
  }[];
  topWalletsYear: {
    address: string;
    totalTransactions: number;
    totalBuys: number;
    totalSells: number;
    totalBuyVolumeEth: number;
    totalSellVolumeEth: number;
  }[];
}

interface JudgementsSectionProps {
  data: JudgementsData | null;
}

export function JudgementsSection({ data }: JudgementsSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-700" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
          Judgements
        </h2>
        <div className="h-px flex-1 bg-gray-700" />
      </div>

      <div className="space-y-4">
        {/* Trend cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TrendCard label="Activity" value={data?.vs24h ?? null} period="24h ago" />
          <TrendCard label="Activity" value={data?.vs7d ?? null} period="7d ago" />
          <DominantActivityCard activity={data?.dominantActivity ?? null} />
        </div>

        {/* Top wallets table */}
        <TopWalletsTable
          walletsMonth={data?.topWalletsMonth ?? []}
          walletsYear={data?.topWalletsYear ?? []}
        />
      </div>
    </section>
  );
}
