"use client";

import { KpiCard } from "./KpiCard";
import { formatEth, formatNumber, formatUsd } from "@/lib/utils/formatters";

interface Snapshot {
  floorPriceEth: number;
  floorPriceUsd?: number | null;
  floorPriceChange24h?: number | null;
  totalForSale?: number | null;
  sales24h?: number | null;
  salesVolumeEth24h?: number | null;
  totalOwners?: number | null;
  walletMovements24h?: number | null;
  whaleSales24h?: number | null;
}

interface KpiGridProps {
  snapshot: Snapshot | null;
}

export function KpiGrid({ snapshot }: KpiGridProps) {
  if (!snapshot) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-gray-700 bg-gray-800"
          />
        ))}
      </div>
    );
  }

  const floorSubtitle = snapshot.floorPriceUsd
    ? formatUsd(snapshot.floorPriceUsd)
    : undefined;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <KpiCard
        title="Floor Price"
        value={formatEth(snapshot.floorPriceEth)}
        subtitle={floorSubtitle}
        change={snapshot.floorPriceChange24h}
        accentColor="blue"
      />
      <KpiCard
        title="24h Sales"
        value={formatNumber(snapshot.sales24h)}
        accentColor="purple"
      />
      <KpiCard
        title="For Sale"
        value={formatNumber(snapshot.totalForSale)}
        subtitle="active listings"
        accentColor="green"
      />
      <KpiCard
        title="24h Volume"
        value={formatEth(snapshot.salesVolumeEth24h, 0)}
        accentColor="orange"
      />
      <KpiCard
        title="Wallet Movements"
        value={formatNumber(snapshot.walletMovements24h)}
        subtitle="unique wallets 24h"
        accentColor="pink"
      />
      <KpiCard
        title="Whale Sales"
        value={formatNumber(snapshot.whaleSales24h)}
        subtitle=">30 ETH in 24h"
        accentColor="yellow"
      />
      <KpiCard
        title="Total Owners"
        value={formatNumber(snapshot.totalOwners)}
        accentColor="cyan"
      />
    </div>
  );
}
