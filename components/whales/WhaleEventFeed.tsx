"use client";

import Link from "next/link";
import { shortenAddress, timeAgo } from "@/lib/utils/formatters";

interface WhaleEventEntry {
  id: number;
  address: string;
  eventType: string;
  punkId: number | null;
  valueEth: number | null;
  counterparty: string | null;
  eventAt: string | Date;
  whale: {
    address: string;
    ensName: string | null;
    punkCount: number;
    trend: string | null;
  };
}

interface DayGroup {
  label: string;
  events: WhaleEventEntry[];
}

interface WhaleEventFeedProps {
  groups: DayGroup[];
}

const EVENT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  Purchased:        { label: "Purchased",     color: "text-green-400",  bg: "bg-green-900/40 border-green-700/50",  icon: "🛒" },
  Sold:             { label: "Sold",           color: "text-orange-400", bg: "bg-orange-900/40 border-orange-700/50", icon: "💸" },
  Sent:             { label: "Sent",           color: "text-blue-400",   bg: "bg-blue-900/40 border-blue-700/50",    icon: "📤" },
  Received:         { label: "Received",       color: "text-cyan-400",   bg: "bg-cyan-900/40 border-cyan-700/50",    icon: "📥" },
  "Offered for Sale": { label: "Offer",        color: "text-yellow-400", bg: "bg-yellow-900/40 border-yellow-700/50", icon: "🏷️" },
  "Bid Placed":     { label: "Bid",            color: "text-purple-400", bg: "bg-purple-900/40 border-purple-700/50", icon: "💎" },
};

const FALLBACK_CONFIG = {
  label: "Event",
  color: "text-gray-400",
  bg: "bg-gray-800/40 border-gray-700/50",
  icon: "•",
};

function EventRow({ ev }: { ev: WhaleEventEntry }) {
  const cfg = EVENT_CONFIG[ev.eventType] ?? FALLBACK_CONFIG;
  const displayName = ev.whale.ensName ?? shortenAddress(ev.whale.address);
  const valueStr = ev.valueEth != null ? `${ev.valueEth.toFixed(2)} ETH` : null;

  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${cfg.bg}`}
    >
      {/* Left: badge + wallet + details */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}
          style={{ borderColor: "transparent" }}
        >
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </span>

        <Link
          href={`/whales/${ev.whale.address}`}
          className={`font-mono text-sm font-semibold hover:underline ${cfg.color}`}
        >
          {displayName}
        </Link>

        {ev.punkId != null && (
          <span className="text-sm text-white">
            Punk <span className="font-bold">#{ev.punkId}</span>
          </span>
        )}

        {valueStr && (
          <span className="rounded bg-gray-900/60 px-2 py-0.5 font-mono text-xs text-white">
            {valueStr}
          </span>
        )}

        {ev.counterparty && (
          <span className="text-xs text-gray-400">
            {ev.eventType === "Purchased" || ev.eventType === "Received"
              ? "from "
              : "to "}
            <span className="font-mono text-gray-300">
              {shortenAddress(ev.counterparty)}
            </span>
          </span>
        )}
      </div>

      {/* Right: timestamp */}
      <span className="shrink-0 text-xs text-gray-500">
        {timeAgo(ev.eventAt)}
      </span>
    </div>
  );
}

export function WhaleEventFeed({ groups }: WhaleEventFeedProps) {
  if (groups.length === 0 || groups.every((g) => g.events.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 py-16 text-center">
        <p className="text-4xl">🔕</p>
        <p className="text-sm font-medium text-gray-300">No events recorded yet</p>
        <p className="text-xs text-gray-500">
          Trigger a new scrape to collect events — the whale seed fetches all
          transaction histories.
        </p>
        <a
          href="/api/whales/seed?secret=local-dev-secret"
          className="mt-1 rounded-lg border border-blue-700 bg-blue-900/30 px-4 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-900/60"
        >
          Trigger Seed (POST)
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Day divider */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-700" />
            <span className="text-sm font-bold text-white">{group.label}</span>
            <div className="h-px flex-1 bg-gray-700" />
          </div>

          {/* Events for this day */}
          <div className="space-y-2">
            {group.events.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
