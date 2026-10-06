-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" SERIAL NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "floorPriceEth" DOUBLE PRECISION NOT NULL,
    "floorPriceUsd" DOUBLE PRECISION,
    "floorPriceChange24h" DOUBLE PRECISION,
    "totalForSale" INTEGER,
    "sales24h" INTEGER,
    "salesVolumeEth24h" DOUBLE PRECISION,
    "avgSalePriceEth24h" DOUBLE PRECISION,
    "totalOwners" INTEGER,
    "whaleSales24h" INTEGER,
    "whaleVolumeEth24h" DOUBLE PRECISION,
    "uniqueBuyers24h" INTEGER,
    "uniqueSellers24h" INTEGER,
    "walletMovements24h" INTEGER,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "punkId" INTEGER NOT NULL,
    "priceEth" DOUBLE PRECISION NOT NULL,
    "sellerAddress" TEXT,
    "buyerAddress" TEXT,
    "marketplace" TEXT,
    "txHash" TEXT,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "punkId" INTEGER NOT NULL,
    "askPriceEth" DOUBLE PRECISION NOT NULL,
    "sellerAddress" TEXT,
    "listedAt" TIMESTAMP(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletStat" (
    "address" TEXT NOT NULL,
    "ensName" TEXT,
    "totalBuys" INTEGER NOT NULL DEFAULT 0,
    "totalSells" INTEGER NOT NULL DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalBuyVolumeEth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSellVolumeEth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "avgDaysBetweenTx" DOUBLE PRECISION,
    "lastTxAt" TIMESTAMP(3),
    "daysSinceLastTx" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletStat_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_txHash_key" ON "Sale"("txHash");

-- CreateIndex
CREATE INDEX "Sale_soldAt_idx" ON "Sale"("soldAt" DESC);

-- CreateIndex
CREATE INDEX "Sale_priceEth_idx" ON "Sale"("priceEth" DESC);

-- CreateIndex
CREATE INDEX "Sale_buyerAddress_idx" ON "Sale"("buyerAddress");

-- CreateIndex
CREATE INDEX "Sale_sellerAddress_idx" ON "Sale"("sellerAddress");

-- CreateIndex
CREATE INDEX "Sale_snapshotId_idx" ON "Sale"("snapshotId");

-- CreateIndex
CREATE INDEX "Listing_askPriceEth_idx" ON "Listing"("askPriceEth");

-- CreateIndex
CREATE INDEX "Listing_snapshotId_idx" ON "Listing"("snapshotId");

-- CreateIndex
CREATE INDEX "WalletStat_totalTransactions_idx" ON "WalletStat"("totalTransactions" DESC);

-- CreateIndex
CREATE INDEX "WalletStat_lastSeenAt_idx" ON "WalletStat"("lastSeenAt" DESC);

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "DailySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "DailySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
