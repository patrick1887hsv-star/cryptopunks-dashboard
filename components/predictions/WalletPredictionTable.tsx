"use client";

import { cn } from "@/lib/utils";
import { shortenAddress, formatNumber } from "@/lib/utils/formatters";

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

interface WalletPredictionTableProps {
  wallets: WalletScore[];
}

const actionConfig = {
  buy:     { label: "Buy",     color: "bg-green-900/50 text-green-400 border border-green-800"  },
  sell:    { label: "Sell",    color: "bg-red-900/50 text-red-400 border border-red-800"        },
  bid:     { label: "Bid",     color: "bg-yellow-900/50 text-yellow-400 border border-yellow-800" },
  unknown: { label: "Unknown", color: "bg-gray-700 text-gray-400 border border-gray-600"        },
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-gray-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-700">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white">{score}</span>
    </div>
  );
}

export function WalletPredictionTable({ wallets }: WalletPredictionTableProps) {
  if (wallets.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No prediction data yet — predictions require wallet history from scraped sales
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="pb-2 pr-4">#</th>
            <th className="pb-2 pr-4">Address</th>
            <th className="pb-2 pr-4">Score</th>
            <th className="pb-2 pr-4">Likely Action</th>
            <th className="pb-2 pr-4 text-right">Txns</th>
            <th className="pb-2">Reasoning</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {wallets.map((w, i) => {
            const action = actionConfig[w.likelyAction] ?? actionConfig.unknown;
            return (
              <tr
                key={w.address}
                className="transition-colors hover:bg-gray-700/30"
              >
                <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                <td className="py-3 pr-4 font-mono text-gray-300">
                  {shortenAddress(w.address, 6)}
                </td>
                <td className="py-3 pr-4">
                  <ScoreBar score={w.score} />
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      action.color
                    )}
                  >
                    {action.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-bold text-white">
                  {formatNumber(w.totalTransactions)}
                </td>
                <td className="py-3 text-xs text-gray-400">
                  {w.reasoning.join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
