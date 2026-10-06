"use client";

import { cn } from "@/lib/utils";

interface DominantActivity {
  type: "buy" | "sell" | "neutral";
  buyPercent: number;
  sellPercent: number;
  description: string;
}

interface DominantActivityCardProps {
  activity: DominantActivity | null;
}

export function DominantActivityCard({ activity }: DominantActivityCardProps) {
  if (!activity) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Dominant Activity
        </p>
        <p className="mt-2 text-lg font-bold text-gray-500">No data yet</p>
      </div>
    );
  }

  const { type, buyPercent, sellPercent, description } = activity;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Dominant Activity
      </p>
      <p
        className={cn(
          "mt-2 text-xl font-bold",
          type === "buy" && "text-green-400",
          type === "sell" && "text-red-400",
          type === "neutral" && "text-yellow-400"
        )}
      >
        {type === "buy" ? "Buy Pressure" : type === "sell" ? "Sell Pressure" : "Balanced"}
      </p>
      <p className="mt-1 text-sm text-gray-400">{description}</p>

      {/* Bar visualization */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${buyPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span className="text-green-400">{buyPercent}% buy</span>
        <span className="text-red-400">{sellPercent}% sell</span>
      </div>
    </div>
  );
}
