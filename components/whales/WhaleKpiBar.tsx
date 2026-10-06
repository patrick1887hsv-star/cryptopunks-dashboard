import { KpiCard } from "@/components/dashboard/KpiCard";

interface WhaleWallet {
  punkCount: number;
  trend: string | null;
}

interface WhaleKpiBarProps {
  whales: WhaleWallet[];
}

export function WhaleKpiBar({ whales }: WhaleKpiBarProps) {
  const totalWhales = whales.length;
  const totalPunks = whales.reduce((s, w) => s + w.punkCount, 0);
  const accumulating = whales.filter((w) => w.trend === "accumulating").length;
  const selling = whales.filter((w) => w.trend === "selling").length;
  const trading = whales.filter((w) => w.trend === "trading").length;
  const holding = whales.filter((w) => w.trend === "holding" || !w.trend).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title="Whale Wallets"
        value={String(totalWhales)}
        subtitle="> 10 punks held"
        accentColor="purple"
        icon="🐋"
      />
      <KpiCard
        title="Punks Held"
        value={totalPunks.toLocaleString()}
        subtitle={`${((totalPunks / 10000) * 100).toFixed(1)}% of supply`}
        accentColor="blue"
        icon="🎭"
      />
      <KpiCard
        title="Accumulating"
        value={String(accumulating)}
        subtitle="Bought > 1 in 12m, not selling"
        accentColor="green"
        icon="📈"
      />
      <KpiCard
        title="Selling"
        value={String(selling)}
        subtitle="Sold > 1 in 12m, not buying"
        accentColor="orange"
        icon="📉"
      />
      <KpiCard
        title="Trading"
        value={String(trading)}
        subtitle="Both bought & sold > 1 in 12m"
        accentColor="cyan"
        icon="🔄"
      />
      <KpiCard
        title="Holding"
        value={String(holding)}
        subtitle="No buys or sells in 12m"
        accentColor="yellow"
        icon="🔒"
      />
    </div>
  );
}
