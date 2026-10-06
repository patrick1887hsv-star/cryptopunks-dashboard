import { shortenAddress, timeAgo } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface TxRow {
  type: string;
  punkId?: number | null;
  value?: string | number | null;
  timestamp?: string | number | null;
  from?: string | null;
  to?: string | null;
}

interface TransactionTableProps {
  transactions: TxRow[];
  viewerAddress: string;
}

const TX_COLORS: Record<string, string> = {
  Purchased: "text-green-400",
  Sold: "text-red-400",
  "Offered for Sale": "text-yellow-400",
  Received: "text-blue-400",
  Sent: "text-orange-400",
};

function parseWei(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return 0;
  return n > 1e15 ? n / 1e18 : n;
}

export function TransactionTable({ transactions, viewerAddress }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-500">
        No transaction history available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-700">
          <tr>
            {["Date", "Type", "Punk #", "Amount", "Counterparty"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {transactions.slice(0, 50).map((tx, i) => {
            const priceEth = parseWei(tx.value);
            const counterparty =
              tx.type === "Purchased" || tx.type === "Received"
                ? tx.from
                : tx.to;
            const tsMs =
              typeof tx.timestamp === "number"
                ? tx.timestamp * 1000
                : tx.timestamp
                ? new Date(tx.timestamp).getTime()
                : null;

            return (
              <tr key={i} className="hover:bg-gray-700/30">
                <td className="px-3 py-2 text-gray-400">
                  {tsMs ? timeAgo(new Date(tsMs)) : "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 font-medium",
                    TX_COLORS[tx.type] ?? "text-gray-300"
                  )}
                >
                  {tx.type}
                </td>
                <td className="px-3 py-2 font-mono text-gray-300">
                  {tx.punkId != null ? `#${tx.punkId}` : "—"}
                </td>
                <td className="px-3 py-2 text-gray-300">
                  {priceEth > 0 ? `${priceEth.toFixed(2)} ETH` : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-gray-400">
                  {counterparty ? shortenAddress(counterparty) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
