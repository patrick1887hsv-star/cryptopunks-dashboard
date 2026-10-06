"use client";

import { useState } from "react";
import Link from "next/link";
import { shortenAddress, timeAgo } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface WhaleWallet {
  address: string;
  ensName: string | null;
  punkCount: number;
  forSaleCount: number;
  buys12m: number;
  sells12m: number;
  sent12m: number;
  received12m: number;
  offers12m: number;
  bids12m: number;
  trend: string | null;
  lastTxAt: string | Date | null;
}

interface WhaleLeaderboardProps {
  whales: WhaleWallet[];
}

type SortKey = keyof Pick<
  WhaleWallet,
  "punkCount" | "forSaleCount" | "buys12m" | "sells12m" | "sent12m" | "received12m" | "offers12m" | "bids12m" | "lastTxAt"
>;

export const TREND_STYLES: Record<string, string> = {
  accumulating: "bg-green-900/50 text-green-400",
  selling:      "bg-orange-900/50 text-orange-400",
  trading:      "bg-cyan-900/50 text-cyan-400",
  holding:      "bg-gray-700/50 text-gray-400",
};

export const TREND_LABELS: Record<string, string> = {
  accumulating: "Accumulating",
  selling:      "Selling",
  trading:      "Trading",
  holding:      "Holding",
};

function ColHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === current;
  return (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white"
      onClick={() => onClick(sortKey)}
    >
      {label}
      {active && (
        <span className="ml-1 text-blue-400">{dir === "desc" ? "▼" : "▲"}</span>
      )}
    </th>
  );
}

export function WhaleLeaderboard({ whales }: WhaleLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("punkCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...whales].sort((a, b) => {
    let av: number;
    let bv: number;
    if (sortKey === "lastTxAt") {
      av = a.lastTxAt ? new Date(a.lastTxAt).getTime() : 0;
      bv = b.lastTxAt ? new Date(b.lastTxAt).getTime() : 0;
    } else {
      av = (a[sortKey] as number) ?? 0;
      bv = (b[sortKey] as number) ?? 0;
    }
    return sortDir === "desc" ? bv - av : av - bv;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-500">
        No whale wallets yet — trigger a scrape or seed scan first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-700">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              Rank
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              Address
            </th>
            <ColHeader label="Punks" sortKey="punkCount" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="For Sale" sortKey="forSaleCount" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Buys" sortKey="buys12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Sells" sortKey="sells12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Sent" sortKey="sent12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Rcvd" sortKey="received12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Offers" sortKey="offers12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="12m Bids" sortKey="bids12m" current={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="Last Tx" sortKey="lastTxAt" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {sorted.map((whale, i) => {
            const displayName = whale.ensName ?? shortenAddress(whale.address);
            const trendKey = whale.trend ?? "holding";
            return (
              <tr key={whale.address} className="hover:bg-gray-700/30">
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/whales/${whale.address}`}
                    className="font-mono text-blue-400 hover:underline"
                  >
                    {displayName}
                  </Link>
                </td>
                <td className="px-3 py-2 font-semibold text-white">
                  {whale.punkCount}
                </td>
                <td className="px-3 py-2 text-gray-300">{whale.forSaleCount}</td>
                <td className="px-3 py-2 text-green-400">{whale.buys12m}</td>
                <td className="px-3 py-2 text-orange-400">{whale.sells12m}</td>
                <td className="px-3 py-2 text-blue-400">{whale.sent12m}</td>
                <td className="px-3 py-2 text-cyan-400">{whale.received12m}</td>
                <td className="px-3 py-2 text-yellow-400">{whale.offers12m}</td>
                <td className="px-3 py-2 text-purple-400">{whale.bids12m}</td>
                <td className="px-3 py-2 text-gray-400">
                  {whale.lastTxAt ? timeAgo(whale.lastTxAt) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      TREND_STYLES[trendKey] ?? TREND_STYLES.holding
                    )}
                  >
                    {TREND_LABELS[trendKey] ?? "Holding"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
