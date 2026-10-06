import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { WhaleEventFeed } from "@/components/whales/WhaleEventFeed";
import { RefreshButton } from "@/components/dashboard/RefreshButton";

export const revalidate = 60;

const EVENT_TYPES = [
  { key: "Purchased",        label: "Buys",    color: "text-green-400",  icon: "🛒" },
  { key: "Sold",             label: "Sells",   color: "text-orange-400", icon: "💸" },
  { key: "Sent",             label: "Sent",    color: "text-blue-400",   icon: "📤" },
  { key: "Received",         label: "Received",color: "text-cyan-400",   icon: "📥" },
  { key: "Offered for Sale", label: "Offers",  color: "text-yellow-400", icon: "🏷️" },
  { key: "Bid Placed",       label: "Bids",    color: "text-purple-400", icon: "💎" },
];

async function getEvents() {
  try {
    return await prisma.whaleEvent.findMany({
      orderBy: { eventAt: "desc" },
      include: {
        whale: {
          select: { address: true, ensName: true, punkCount: true, trend: true },
        },
      },
    });
  } catch {
    return [];
  }
}

function groupEventsByDay(events: Awaited<ReturnType<typeof getEvents>>) {
  const groups = new Map<string, { label: string; events: typeof events }>();
  for (const ev of events) {
    const d = new Date(ev.eventAt);
    const key = d.toISOString().slice(0, 10);
    if (!groups.has(key)) {
      const label = d.toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
      });
      groups.set(key, { label, events: [] });
    }
    groups.get(key)!.events.push(ev);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

export default async function WhaleChangesPage() {
  const events = await getEvents();
  const groups = groupEventsByDay(events);

  const counts = Object.fromEntries(
    EVENT_TYPES.map((t) => [
      t.key,
      events.filter((e) => e.eventType === t.key).length,
    ])
  );
  const totalEvents = events.length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Whale Activity History
              </h1>
              <p className="text-xs text-gray-500">
                Full running history of whale wallet activity
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="hidden text-gray-400 hover:text-white sm:block">
              Main Dashboard
            </Link>
            <Link href="/whales" className="text-gray-400 hover:text-white">
              Whale Tracker
            </Link>
            <span className="text-blue-400 font-medium">Activity History</span>
            <RefreshButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* KPI bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {/* Total */}
          <div className="col-span-1 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Events
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {totalEvents}
            </p>
          </div>

          {/* Per-type counts */}
          {EVENT_TYPES.map((t) => (
            <div
              key={t.key}
              className="rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t.icon} {t.label}
              </p>
              <p className={`mt-1 text-2xl font-extrabold ${t.color}`}>
                {counts[t.key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* Event feed */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Activity Feed
            </h2>
            {totalEvents > 0 && (
              <span className="text-xs text-gray-500">
                {totalEvents} event{totalEvents !== 1 ? "s" : ""} across {groups.length} day{groups.length !== 1 ? "s" : ""} · newest first
              </span>
            )}
          </div>
          <WhaleEventFeed groups={groups as any} />
        </section>
      </main>

      <footer className="border-t border-gray-800 px-4 py-6 text-center text-xs text-gray-600">
        Whale Activity History · Events stored during each whale scrape ·{" "}
        <a
          href="/api/whales/seed?secret=local-dev-secret"
          className="hover:text-gray-400"
        >
          [Trigger Seed to Collect Events]
        </a>
      </footer>
    </div>
  );
}
