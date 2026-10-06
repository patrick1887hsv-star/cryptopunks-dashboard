"use client";

import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface TrendPoint {
  date: string;
  totalPunks: number;
  forSale: number;
  whaleCount: number;
}

interface AccumulationChartProps {
  trends: TrendPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-xl">
      <p className="mb-1 text-gray-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AccumulationChart({ trends }: AccumulationChartProps) {
  if (trends.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-500">
        No whale history yet — run a scrape to populate charts
      </div>
    );
  }

  const data = trends.map((t) => ({
    date: format(new Date(t.date), "MMM d"),
    "Punks Held": t.totalPunks,
    "For Sale": t.forSale,
    Whales: t.whaleCount,
  }));

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Whale Holdings (30d)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Punks Held"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
          />
          <Bar yAxisId="right" dataKey="For Sale" fill="#f97316" opacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
