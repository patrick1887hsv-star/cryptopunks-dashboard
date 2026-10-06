"use client";

import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";

interface TrendCardProps {
  label: string;
  value: number | null;
  period: string;
}

export function TrendCard({ label, value, period }: TrendCardProps) {
  const isPositive = value != null && value > 0;
  const isNegative = value != null && value < 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label} vs {period}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            "text-2xl font-bold",
            isPositive && "text-green-400",
            isNegative && "text-red-400",
            !isPositive && !isNegative && "text-yellow-400"
          )}
        >
          {value == null
            ? "N/A"
            : `${isPositive ? "▲" : isNegative ? "▼" : "—"} ${formatPercent(Math.abs(value ?? 0))}`}
        </span>
        <span className="text-sm text-gray-400">activity</span>
      </div>
    </div>
  );
}
