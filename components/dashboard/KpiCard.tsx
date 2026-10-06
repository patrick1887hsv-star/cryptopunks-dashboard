"use client";

import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number | null;
  accentColor: string; // Tailwind color class e.g. "blue", "purple"
  icon?: React.ReactNode;
}

const accentMap: Record<string, { border: string; text: string; bg: string }> = {
  blue:   { border: "border-blue-500",   text: "text-blue-400",   bg: "bg-blue-500/10"   },
  purple: { border: "border-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
  green:  { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/10"  },
  orange: { border: "border-orange-500", text: "text-orange-400", bg: "bg-orange-500/10" },
  pink:   { border: "border-pink-500",   text: "text-pink-400",   bg: "bg-pink-500/10"   },
  yellow: { border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  cyan:   { border: "border-cyan-500",   text: "text-cyan-400",   bg: "bg-cyan-500/10"   },
};

export function KpiCard({ title, value, subtitle, change, accentColor, icon }: KpiCardProps) {
  const accent = accentMap[accentColor] ?? accentMap.blue;
  const isPositive = change != null && change > 0;
  const isNegative = change != null && change < 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gray-800/80 p-5 backdrop-blur",
        accent.border
      )}
    >
      {/* Accent glow top-right */}
      <div
        className={cn(
          "pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl",
          accent.bg.replace("/10", "")
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {icon && <span className={cn("text-xl", accent.text)}>{icon}</span>}
      </div>

      <p className={cn("mt-2 text-3xl font-bold tracking-tight text-white")}>
        {value}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {change != null && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              isPositive && "bg-green-900/50 text-green-400",
              isNegative && "bg-red-900/50 text-red-400",
              !isPositive && !isNegative && "bg-yellow-900/50 text-yellow-400"
            )}
          >
            {isPositive ? "▲" : isNegative ? "▼" : "—"}{" "}
            {formatPercent(Math.abs(change ?? 0))}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-gray-500">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
