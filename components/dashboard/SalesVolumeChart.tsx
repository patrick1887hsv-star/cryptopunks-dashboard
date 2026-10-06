"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  scrapedAt: string | Date;
  sales24h?: number | null;
  salesVolumeEth24h?: number | null;
}

interface SalesVolumeChartProps {
  data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400">{label}</p>
      <p className="font-bold text-purple-400">
        {payload[0]?.value ?? 0} sales
      </p>
      {payload[1] && (
        <p className="font-semibold text-orange-400">
          {payload[1]?.value?.toFixed(1)}Ξ volume
        </p>
      )}
    </div>
  );
}

export function SalesVolumeChart({ data }: SalesVolumeChartProps) {
  const formatted = data.map((d) => ({
    date: format(new Date(d.scrapedAt), "MMM d"),
    sales: d.sales24h ?? 0,
    volume: d.salesVolumeEth24h ?? 0,
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
        Daily Sales Volume (30d)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formatted}>
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
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sales" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
