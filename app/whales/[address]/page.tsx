import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { WalletProfileHeader } from "@/components/whales/WalletProfileHeader";
import { PunkCountChart } from "@/components/whales/PunkCountChart";
import { TransactionTable } from "@/components/whales/TransactionTable";

export const revalidate = 60;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cryptopunks.app/",
};

async function getWalletData(address: string) {
  const addr = address.toLowerCase();

  const [dbWhale, liveRes] = await Promise.allSettled([
    prisma.whaleWallet.findUnique({
      where: { address: addr },
      include: {
        history: {
          orderBy: { scrapedAt: "asc" },
          select: { punkCount: true, forSaleCount: true, scrapedAt: true },
        },
      },
    }),
    fetch(`https://www.cryptopunks.app/api/account/${address}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    }),
  ]);

  const whale = dbWhale.status === "fulfilled" ? dbWhale.value : null;

  let liveData: any = null;
  if (liveRes.status === "fulfilled" && liveRes.value.ok) {
    const json = await liveRes.value.json().catch(() => null);
    liveData = json?.data ?? null;
  }

  return { whale, liveData };
}

export default async function WalletProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const { whale, liveData } = await getWalletData(address);

  if (!whale && !liveData) {
    notFound();
  }

  // Prefer DB data, fall back to live for display
  const punkCount =
    whale?.punkCount ??
    (Array.isArray(liveData?.owned) ? liveData.owned.length : 0);
  const forSaleCount =
    whale?.forSaleCount ??
    (Array.isArray(liveData?.forSale) ? liveData.forSale.length : 0);
  const ensName = whale?.ensName ?? liveData?.ethAddress?.ensAddress ?? null;
  const totalBought =
    whale?.totalBought ??
    (Array.isArray(liveData?.punksBoughtByAddress)
      ? liveData.punksBoughtByAddress.length
      : 0);
  const totalSold =
    whale?.totalSold ??
    (Array.isArray(liveData?.punksSoldByAddress)
      ? liveData.punksSoldByAddress.length
      : 0);
  const buys12m = whale?.buys12m ?? 0;
  const sells12m = whale?.sells12m ?? 0;
  const sent12m = whale?.sent12m ?? 0;
  const received12m = whale?.received12m ?? 0;
  const offers12m = whale?.offers12m ?? 0;
  const bids12m = whale?.bids12m ?? 0;
  const lastTxAt = whale?.lastTxAt ?? null;

  const transactions: any[] = Array.isArray(liveData?.transactionHistory)
    ? liveData.transactionHistory
    : [];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-3 text-sm text-gray-400">
            <Link href="/" className="hover:text-white">
              Main Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/whales" className="hover:text-white">
              Whale Tracker
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-mono">{address.slice(0, 10)}…</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Profile Header */}
        <WalletProfileHeader
          address={address}
          ensName={ensName}
          punkCount={punkCount}
          forSaleCount={forSaleCount}
          trend={whale?.trend ?? null}
          totalBought={totalBought}
          totalSold={totalSold}
          buys12m={buys12m}
          sells12m={sells12m}
          sent12m={sent12m}
          received12m={received12m}
          offers12m={offers12m}
          bids12m={bids12m}
          lastTxAt={lastTxAt}
        />

        {/* Punk Count Chart */}
        <PunkCountChart history={whale?.history ?? []} />

        {/* Transaction History */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Transaction History
          </h2>
          <TransactionTable
            transactions={transactions}
            viewerAddress={address}
          />
        </section>
      </main>

      <footer className="border-t border-gray-800 px-4 py-6 text-center text-xs text-gray-600">
        CryptoPunks Whale Tracker · Live data from cryptopunks.app
      </footer>
    </div>
  );
}
