import { prisma } from "@/lib/db/client";

const API_BASE = "https://www.cryptopunks.app/api";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cryptopunks.app/",
};

const opts = () => ({ headers: HEADERS, signal: AbortSignal.timeout(20000) });

const WHALE_THRESHOLD = 10;
const ACCOUNT_DELAY_MS = 500;
const EVENT_WINDOW_MS = 7 * 86400000; // store 7 days of events

interface LeaderboardHolder {
  address: string;
  punkCount: number;
  ensAddress: string | null;
  lastActive: number | null;
}

interface TxEvent {
  type: string;
  punkId: number | null;
  valueEth: number | null;
  counterparty: string | null;
  txHash: string | null;
  timestamp: number;
}

interface AccountData {
  punkCount: number;
  forSaleCount: number;
  ensName: string | null;
  lastTxAt: Date | null;
  totalBought: number;
  totalSold: number;
  buys12m: number;
  sells12m: number;
  sent12m: number;
  received12m: number;
  offers12m: number;
  bids12m: number;
  recentEvents: TxEvent[];
}

async function fetchWhaleLeaderboard(): Promise<LeaderboardHolder[]> {
  const res = await fetch(`${API_BASE}/punks?action=leaderboard`, opts());
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  const json = await res.json();
  const holders: any[] = json?.data?.topHolders ?? [];
  return holders
    .filter((h: any) => (h.punkCount ?? 0) > WHALE_THRESHOLD)
    .map((h: any) => ({
      address: (h.address as string).toLowerCase(),
      punkCount: h.punkCount as number,
      ensAddress: h.ensAddress ?? null,
      lastActive: h.lastActive ?? null,
    }));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseEthAmount(amount?: string): number | null {
  if (!amount) return null;
  const val = parseFloat(amount.replace(/,/g, "").split(" ")[0]);
  return isNaN(val) ? null : val;
}

async function fetchAccountData(address: string): Promise<AccountData | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/account/${address}`, opts());

      if (res.status === 429) {
        const wait = 2000 * 2 ** attempt;
        console.warn(`[whales] 429 for ${address.slice(0, 10)}, retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) return null;

      const json = await res.json().catch(() => null);
      if (!json?.data) return null;

      const data = json.data;
      const owned: any[] = Array.isArray(data.owned) ? data.owned : [];
      const forSale: any[] = Array.isArray(data.forSale) ? data.forSale : [];
      const txHistory: any[] = Array.isArray(data.transactionHistory)
        ? data.transactionHistory
        : [];
      const totalBought: number = Array.isArray(data.punksBoughtByAddress)
        ? data.punksBoughtByAddress.length
        : 0;
      const totalSold: number = Array.isArray(data.punksSoldByAddress)
        ? data.punksSoldByAddress.length
        : 0;

      const ensName: string | null = data.ethAddress?.ensAddress ?? null;
      const lastActiveRaw = data.ethAddress?.lastActive;
      const lastTxAt: Date | null = lastActiveRaw
        ? new Date(
            typeof lastActiveRaw === "number"
              ? lastActiveRaw * 1000
              : lastActiveRaw
          )
        : null;

      const cutoff12m = Date.now() - 365 * 86400000;
      const cutoffEvents = Date.now() - EVENT_WINDOW_MS;
      let buys12m = 0;
      let sells12m = 0;
      let sent12m = 0;
      let received12m = 0;
      let offers12m = 0;
      let bids12m = 0;
      const recentEvents: TxEvent[] = [];

      for (const tx of txHistory) {
        const txTime = tx.timestamp ? tx.timestamp * 1000 : 0;
        const type: string = tx.type ?? "";

        if (txTime >= cutoff12m) {
          if (type === "Purchased") buys12m++;
          else if (type === "Sold") sells12m++;
          else if (type === "Sent") sent12m++;
          else if (type === "Received") received12m++;
          else if (type === "Offered for Sale") offers12m++;
          else if (type === "Bid Placed") bids12m++;
        }

        if (txTime >= cutoffEvents && tx.transactionHash) {
          const from: string = tx.from ?? "";
          const to: string = tx.to ?? "";
          const counterparty =
            [to, from].find(
              (a) => a && a.toLowerCase() !== address.toLowerCase()
            ) ?? null;

          recentEvents.push({
            type,
            punkId: tx.punkIndex ?? null,
            valueEth: parseEthAmount(tx.amount),
            counterparty: counterparty || null,
            txHash: tx.transactionHash,
            timestamp: tx.timestamp,
          });
        }
      }

      return {
        punkCount: owned.length,
        forSaleCount: forSale.length,
        ensName,
        lastTxAt,
        totalBought,
        totalSold,
        buys12m,
        sells12m,
        sent12m,
        received12m,
        offers12m,
        bids12m,
        recentEvents,
      };
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchSequential<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  delayMs = ACCOUNT_DELAY_MS
): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) {
    results.push(await fn(item));
    if (delayMs > 0) await sleep(delayMs);
  }
  return results;
}

function classifyTrend(buys12m: number, sells12m: number): string {
  const buying = buys12m > 1;
  const selling = sells12m > 1;
  if (buying && selling) return "trading";
  if (buying) return "accumulating";
  if (selling) return "selling";
  return "holding";
}

async function upsertWhales(whaleAddresses: string[]): Promise<number> {
  const now = new Date();
  let upserted = 0;
  const allEvents: {
    address: string;
    eventType: string;
    punkId: number | null;
    valueEth: number | null;
    counterparty: string | null;
    txHash: string;
    eventAt: Date;
    scrapedAt: Date;
  }[] = [];

  await fetchSequential(whaleAddresses, async (address) => {
    const data = await fetchAccountData(address);
    if (!data) return;

    if (data.punkCount <= WHALE_THRESHOLD) {
      await prisma.whaleWallet
        .update({
          where: { address },
          data: { punkCount: data.punkCount, forSaleCount: data.forSaleCount, lastScrapedAt: now },
        })
        .catch(() => {});
      return;
    }

    const trend = classifyTrend(data.buys12m, data.sells12m);

    await prisma.whaleWallet.upsert({
      where: { address },
      create: {
        address,
        ensName: data.ensName,
        punkCount: data.punkCount,
        forSaleCount: data.forSaleCount,
        trend,
        buys12m: data.buys12m,
        sells12m: data.sells12m,
        sent12m: data.sent12m,
        received12m: data.received12m,
        offers12m: data.offers12m,
        bids12m: data.bids12m,
        totalBought: data.totalBought,
        totalSold: data.totalSold,
        lastTxAt: data.lastTxAt,
        lastScrapedAt: now,
      },
      update: {
        ensName: data.ensName,
        punkCount: data.punkCount,
        forSaleCount: data.forSaleCount,
        trend,
        buys12m: data.buys12m,
        sells12m: data.sells12m,
        sent12m: data.sent12m,
        received12m: data.received12m,
        offers12m: data.offers12m,
        bids12m: data.bids12m,
        totalBought: data.totalBought,
        totalSold: data.totalSold,
        lastTxAt: data.lastTxAt,
        lastScrapedAt: now,
      },
    });

    await prisma.whaleHistory.create({
      data: {
        address,
        punkCount: data.punkCount,
        forSaleCount: data.forSaleCount,
        scrapedAt: now,
      },
    });

    for (const ev of data.recentEvents) {
      allEvents.push({
        address,
        eventType: ev.type,
        punkId: ev.punkId,
        valueEth: ev.valueEth,
        counterparty: ev.counterparty,
        txHash: ev.txHash!,
        eventAt: new Date(ev.timestamp * 1000),
        scrapedAt: now,
      });
    }

    upserted++;
  });

  if (allEvents.length > 0) {
    await prisma.whaleEvent.createMany({
      data: allEvents,
      skipDuplicates: true,
    });
    console.log(`[whales] Stored ${allEvents.length} recent events (deduped on insert)`);
  }

  return upserted;
}

export async function scrapeWhaleWallets(): Promise<void> {
  console.log("[whales] Starting whale wallet scrape");

  const leaderboard = await fetchWhaleLeaderboard().catch((err) => {
    console.error("[whales] Leaderboard fetch failed:", err);
    return [] as LeaderboardHolder[];
  });
  console.log(`[whales] Leaderboard returned ${leaderboard.length} whale addresses`);

  const leaderboardAddrs = new Set(leaderboard.map((h) => h.address));
  const existingWhales = await prisma.whaleWallet.findMany({
    select: { address: true },
  });
  const droppedAddrs = existingWhales
    .map((w) => w.address)
    .filter((a) => !leaderboardAddrs.has(a));

  const allAddresses = [...leaderboard.map((h) => h.address), ...droppedAddrs];

  const upserted = await upsertWhales(allAddresses);
  console.log(`[whales] Done. Upserted ${upserted} whale wallets.`);
}

export async function seedWhaleWallets(): Promise<void> {
  console.log("[whales/seed] Fetching leaderboard to discover all whale addresses");

  const leaderboard = await fetchWhaleLeaderboard();
  console.log(`[whales/seed] Found ${leaderboard.length} whale addresses from leaderboard`);

  const upserted = await upsertWhales(leaderboard.map((h) => h.address));
  console.log(`[whales/seed] Complete. Upserted ${upserted} whale wallets.`);
}
