"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  scrapedAt: string | Date;
  floorPriceEth: number;
}

interface FloorPriceChartProps {
  data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400">{label}</p>
      <p className="font-bold text-blue-400">
        {payload[0]?.value?.toFixed(2)} ETH
      </p>
    </div>
  );
}

export function FloorPriceChart({ data }: FloorPriceChartProps) {
  const formatted = data.map((d) => ({
    date: format(new Date(d.scrapedAt), "MMM d"),
    eth: d.floorPriceEth,
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-500 text-sm">
        No history yet — run a scrape to populate charts
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Floor Price (30d)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}Ξ`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="eth"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
