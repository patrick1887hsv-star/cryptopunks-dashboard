export interface RawSale {
  punkId: number;
  priceEth: number;
  sellerAddress?: string;
  buyerAddress?: string;
  marketplace?: string;
  txHash?: string;
  soldAt?: Date;
}

export interface RawListing {
  punkId: number;
  askPriceEth: number;
  sellerAddress?: string;
  listedAt?: Date;
}

export interface NftPriceFloorData {
  floorPriceEth: number;
  floorPriceUsd?: number;
  floorPriceChange24h?: number;
  sales24h?: number;
  salesVolumeEth24h?: number;
  avgSalePriceEth24h?: number;
  totalOwners?: number;
  recentSales: RawSale[];
  newListings: RawListing[];
}

export interface CryptoPunksAppData {
  floorPriceEth?: number;
  totalForSale?: number;
  recentSales: RawSale[];
  activeListings: RawListing[];
}

export interface MergedScrapedData {
  snapshot: {
    floorPriceEth: number;
    floorPriceUsd?: number;
    floorPriceChange24h?: number;
    totalForSale?: number;
    sales24h?: number;
    salesVolumeEth24h?: number;
    avgSalePriceEth24h?: number;
    totalOwners?: number;
    whaleSales24h?: number;
    whaleVolumeEth24h?: number;
    uniqueBuyers24h?: number;
    uniqueSellers24h?: number;
    walletMovements24h?: number;
  };
  sales: RawSale[];
  listings: RawListing[];
}
