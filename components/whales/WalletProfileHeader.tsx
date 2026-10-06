import { shortenAddress, timeAgo } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface WalletProfileHeaderProps {
  address: string;
  ensName: string | null;
  punkCount: number;
  forSaleCount: number;
  trend: string | null;
  totalBought: number;
  totalSold: number;
  buys12m: number;
  sells12m: number;
  sent12m: number;
  received12m: number;
  offers12m: number;
  bids12m: number;
  lastTxAt: string | Date | null;
}

const TREND_STYLES: Record<string, { badge: string; desc: string }> = {
  accumulating: {
    badge: "bg-green-900/50 text-green-400 border-green-500/30",
    desc: "Bought > 1 punk in last 12 months",
  },
  selling: {
    badge: "bg-orange-900/50 text-orange-400 border-orange-500/30",
    desc: "Sold > 1 punk in last 12 months",
  },
  trading: {
    badge: "bg-cyan-900/50 text-cyan-400 border-cyan-500/30",
    desc: "Both bought > 1 and sold > 1 in last 12 months",
  },
  holding: {
    badge: "bg-gray-700/50 text-gray-400 border-gray-600/30",
    desc: "No purchases or sales in last 12 months",
  },
};

const TREND_LABELS: Record<string, string> = {
  accumulating: "Accumulating",
  selling: "Selling",
  trading: "Trading",
  holding: "Holding",
};

export function WalletProfileHeader({
  address,
  ensName,
  punkCount,
  forSaleCount,
  trend,
  totalBought,
  totalSold,
  buys12m,
  sells12m,
  sent12m,
  received12m,
  offers12m,
  bids12m,
  lastTxAt,
}: WalletProfileHeaderProps) {
  const trendKey = trend ?? "holding";
  const style = TREND_STYLES[trendKey] ?? TREND_STYLES.holding;
  const displayName = ensName ?? shortenAddress(address, 6);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐋</span>
          <div>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            {ensName && (
              <p className="mt-0.5 font-mono text-xs text-gray-500">{address}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-semibold",
              style.badge
            )}
          >
            {TREND_LABELS[trendKey] ?? "Holding"}
          </span>
          <span className="text-xs text-gray-500">{style.desc}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Punks Held"    value={String(punkCount)}   accent="text-purple-400" />
        <Stat label="For Sale"      value={String(forSaleCount)} accent="text-blue-400"   />
        <Stat label="12m Buys"      value={String(buys12m)}     accent="text-green-400"  />
        <Stat label="12m Sells"     value={String(sells12m)}    accent="text-orange-400" />
        <Stat label="Total Bought"  value={String(totalBought)} accent="text-green-600"  />
        <Stat label="Total Sold"    value={String(totalSold)}   accent="text-orange-600" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="12m Sent"      value={String(sent12m)}     accent="text-blue-400"   />
        <Stat label="12m Received"  value={String(received12m)} accent="text-cyan-400"   />
        <Stat label="12m Offers"    value={String(offers12m)}   accent="text-yellow-400" />
        <Stat label="12m Bids"      value={String(bids12m)}     accent="text-purple-400" />
      </div>

      {lastTxAt && (
        <p className="mt-4 text-xs text-gray-500">
          Last active: <span className="text-gray-300">{timeAgo(lastTxAt)}</span>
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", accent)}>{value}</p>
    </div>
  );
}
