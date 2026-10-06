"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { shortenAddress, formatEth, formatNumber } from "@/lib/utils/formatters";

interface WalletActivity {
  address: string;
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalBuyVolumeEth: number;
  totalSellVolumeEth: number;
}

interface TopWalletsTableProps {
  walletsMonth: WalletActivity[];
  walletsYear: WalletActivity[];
}

function WalletTable({ wallets }: { wallets: WalletActivity[] }) {
  if (wallets.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No wallet activity data yet — more data accumulates over time
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
            <th className="pb-2 pr-4 text-right">Txns</th>
            <th className="pb-2 pr-4 text-right">Buys</th>
            <th className="pb-2 pr-4 text-right">Sells</th>
            <th className="pb-2 text-right">Vol ETH</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {wallets.map((w, i) => (
            <tr key={w.address} className="transition-colors hover:bg-gray-700/30">
              <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
              <td className="py-2 pr-4 font-mono text-gray-300">
                {shortenAddress(w.address, 6)}
              </td>
              <td className="py-2 pr-4 text-right font-bold text-white">
                {formatNumber(w.totalTransactions)}
              </td>
              <td className="py-2 pr-4 text-right text-green-400">
                {formatNumber(w.totalBuys)}
              </td>
              <td className="py-2 pr-4 text-right text-red-400">
                {formatNumber(w.totalSells)}
              </td>
              <td className="py-2 text-right text-orange-400">
                {formatEth(w.totalBuyVolumeEth + w.totalSellVolumeEth, 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopWalletsTable({ walletsMonth, walletsYear }: TopWalletsTableProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Top 10 Most Active Wallets
      </h3>
      <Tabs defaultValue="month">
        <TabsList className="mb-4">
          <TabsTrigger value="month">Past Month</TabsTrigger>
          <TabsTrigger value="year">Past Year</TabsTrigger>
        </TabsList>
        <TabsContent value="month">
          <WalletTable wallets={walletsMonth} />
        </TabsContent>
        <TabsContent value="year">
          <WalletTable wallets={walletsYear} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
