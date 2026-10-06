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

interface HistoryPoint {
  punkCount: number;
  forSaleCount: number;
  scrapedAt: string | Date;
}

interface PunkCountChartProps {
  history: HistoryPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function PunkCountChart({ history }: PunkCountChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-500">
        No history recorded yet
      </div>
    );
  }

  const data = history.map((h) => ({
    date: format(new Date(h.scrapedAt), "MMM d HH:mm"),
    Held: h.punkCount,
    "For Sale": h.forSaleCount,
  }));

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Punk Count Over Time
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Held"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="For Sale"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
