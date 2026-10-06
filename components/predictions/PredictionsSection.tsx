"use client";

import { WalletPredictionTable } from "./WalletPredictionTable";

interface WalletScore {
  address: string;
  score: number;
  likelyAction: "buy" | "sell" | "bid" | "unknown";
  reasoning: string[];
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  daysSinceLastTx: number | null;
}

interface PredictionsSectionProps {
  wallets: WalletScore[];
}

export function PredictionsSection({ wallets }: PredictionsSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-700" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
          Predictions
        </h2>
        <div className="h-px flex-1 bg-gray-700" />
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Likely Next-Movers
          </h3>
          <span className="text-xs text-gray-600">
            Scored by activity pattern, recency & overdue interval
          </span>
        </div>
        <WalletPredictionTable wallets={wallets} />
      </div>
    </section>
  );
}
