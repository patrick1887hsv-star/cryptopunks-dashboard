import type { CryptoPunksAppData, RawListing, RawSale } from "./types";

const API_BASE = "https://www.cryptopunks.app/api/punks";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cryptopunks.app/",
};

export async function scrapeCryptoPunksApp(): Promise<CryptoPunksAppData> {
  try {
    // AbortSignal.timeout must be created fresh per call — a module-level constant
    // would expire once and cause all subsequent requests to fail immediately.
    const opts = () => ({ headers: HEADERS, signal: AbortSignal.timeout(20000) });

    const [floorRes, offeredRes, recentSalesRes] = await Promise.allSettled([
      fetch(`${API_BASE}?action=floor-punk`, opts()),
      fetch(`${API_BASE}?action=offered-ids`, opts()),
      fetch(`${API_BASE}?action=recent-sales`, opts()),
    ]);

    // --- Floor price & floor listing ---
    let floorPriceEth: number | undefined;
    const activeListings: RawListing[] = [];

    if (floorRes.status === "fulfilled" && floorRes.value.ok) {
      const json = await floorRes.value.json().catch(() => null);
      const items: any[] = json?.data?.currentPunkOffers?.items ?? [];
      for (const item of items) {
        const punkId = Number(item.punkId ?? -1);
        const askPriceEth = parseWei(item.minValue);
        if (punkId >= 0 && punkId <= 9999 && askPriceEth > 0) {
          if (!floorPriceEth || askPriceEth < floorPriceEth) {
            floorPriceEth = askPriceEth;
          }
          activeListings.push({
            punkId,
            askPriceEth,
            sellerAddress: item.seller ?? undefined,
            listedAt: item.offeredAt
              ? new Date(item.offeredAt * 1000)
              : undefined,
          });
        }
      }
    } else if (floorRes.status === "rejected") {
      console.warn("[cryptopunks-app] floor-punk fetch failed:", floorRes.reason);
    }

    // --- Total for sale count ---
    let totalForSale: number | undefined;

    if (offeredRes.status === "fulfilled" && offeredRes.value.ok) {
      const json = await offeredRes.value.json().catch(() => null);
      const ids: unknown[] = Array.isArray(json?.data) ? json.data : [];
      if (ids.length > 0) totalForSale = ids.length;
    } else if (offeredRes.status === "rejected") {
      console.warn("[cryptopunks-app] offered-ids fetch failed:", offeredRes.reason);
    }

    // --- Recent sales ---
    const recentSales: RawSale[] = [];

    if (recentSalesRes.status === "fulfilled" && recentSalesRes.value.ok) {
      const json = await recentSalesRes.value.json().catch(() => null);
      const items: any[] = Array.isArray(json?.data) ? json.data : [];
      for (const item of items.slice(0, 100)) {
        const punkId = Number(item.punkId ?? -1);
        const priceEth = parseWei(item.value);
        if (punkId < 0 || punkId > 9999 || priceEth <= 0) continue;
        recentSales.push({
          punkId,
          priceEth,
          sellerAddress: item.seller ?? undefined,
          buyerAddress: item.buyer ?? undefined,
          marketplace: "cryptopunks.app",
          txHash: item.transactionHash ?? undefined,
          soldAt: item.timestamp
            ? new Date(item.timestamp * 1000)
            : undefined,
        });
      }
    } else if (recentSalesRes.status === "rejected") {
      console.warn("[cryptopunks-app] recent-sales fetch failed:", recentSalesRes.reason);
    }

    console.log(
      `[cryptopunks-app] floor=${floorPriceEth ?? "n/a"} ETH, ` +
        `totalForSale=${totalForSale ?? "n/a"}, recentSales=${recentSales.length}`
    );

    return { floorPriceEth, totalForSale, recentSales, activeListings };
  } catch (error) {
    console.error("[cryptopunks-app scraper] Error:", error);
    return { recentSales: [], activeListings: [] };
  }
}

/** Convert a wei string/number to ETH, handling both wei and already-ETH values. */
function parseWei(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") {
    // If it's already a small number it's probably ETH
    return value > 1e15 ? value / 1e18 : value;
  }
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return n > 1e15 ? n / 1e18 : n;
  }
  return 0;
}
