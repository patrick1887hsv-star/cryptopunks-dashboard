import type { NftPriceFloorData } from "./types";

const API_BASE = "https://api-bff.nftpricefloor.com/projects/cryptopunks";

export async function scrapeNftPriceFloor(): Promise<NftPriceFloorData> {
  // Fetch both details and stats in parallel
  const [detailsRes, statsRes] = await Promise.all([
    fetch(`${API_BASE}/details`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    }),
    fetch(`${API_BASE}/stats`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15000),
    }),
  ]);

  if (!detailsRes.ok && !statsRes.ok) {
    throw new Error(`nftpricefloor API responded ${detailsRes.status}/${statsRes.status}`);
  }

  const [details, stats]: [any, any] = await Promise.all([
    detailsRes.ok ? detailsRes.json() : {},
    statsRes.ok ? statsRes.json() : {},
  ]);

  // Floor price — from stats endpoint (more reliable)
  const floorPriceEth =
    stats?.floorInfo?.currentFloorNative ??
    stats?.floorPriceNative ??
    details?.floorPriceNative ??
    details?.floorInfo?.currentFloorNative ??
    0;

  const floorPriceUsd =
    stats?.floorInfo?.currentFloorUsd ??
    stats?.floorPriceUsd ??
    details?.floorPriceUsd ??
    undefined;

  // 24h % change in floor price
  const floorPriceChange24h =
    stats?.floorTemporalityNative?.diff24h ??
    stats?.floorTemporalityUsd?.diff24h ??
    undefined;

  // Sales count (24h from stats.salesTemporalityNative.count.val24h, but it's often null)
  // Fall back to 7d average / 7 as estimate
  const sales24hRaw = stats?.salesTemporalityNative?.count?.val24h;
  const sales24h =
    sales24hRaw != null
      ? Math.round(sales24hRaw)
      : undefined;

  // 24h volume
  const volumeRaw = stats?.salesTemporalityNative?.volume?.val24h;
  const salesVolumeEth24h = volumeRaw ?? undefined;

  const avgSalePriceEth24h =
    sales24h && salesVolumeEth24h && sales24h > 0
      ? salesVolumeEth24h / sales24h
      : undefined;

  const totalOwners = stats?.totalOwners ?? undefined;
  const totalForSale = stats?.listedCount ?? undefined;

  return {
    floorPriceEth,
    floorPriceUsd,
    floorPriceChange24h,
    sales24h,
    salesVolumeEth24h,
    avgSalePriceEth24h,
    totalOwners,
    recentSales: [],   // nftpricefloor stats endpoint doesn't include individual sales
    newListings: [],
  };
}
