"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WhaleWallet {
  trend: string | null;
}

interface WhaleTrendBreakdownProps {
  whales: WhaleWallet[];
}

const CATEGORIES = ["accumulating", "selling", "trading", "holding"] as const;

const COLORS: Record<string, string> = {
  accumulating: "#22c55e",
  selling:      "#f97316",
  trading:      "#06b6d4",
  holding:      "#6b7280",
};

const LABELS: Record<string, string> = {
  accumulating: "Accumulating",
  selling:      "Selling",
  trading:      "Trading",
  holding:      "Holding",
};

export function WhaleTrendBreakdown({ whales }: WhaleTrendBreakdownProps) {
  const counts: Record<string, number> = {
    accumulating: 0,
    selling: 0,
    trading: 0,
    holding: 0,
  };
  for (const w of whales) {
    const t = w.trend ?? "holding";
    counts[t] = (counts[t] ?? 0) + 1;
  }

  const data = CATEGORIES
    .filter((c) => counts[c] > 0)
    .map((c) => ({ name: c, label: LABELS[c], value: counts[c] }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-500">
        No trend data yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Category Breakdown
      </h3>
      <p className="mb-4 text-xs text-gray-600">Based on purchases &amp; sales in last 12 months</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [value, name]}
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#d1d5db", fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
