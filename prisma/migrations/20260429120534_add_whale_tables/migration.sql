-- CreateTable
CREATE TABLE "WhaleWallet" (
    "address" TEXT NOT NULL,
    "ensName" TEXT,
    "punkCount" INTEGER NOT NULL DEFAULT 0,
    "forSaleCount" INTEGER NOT NULL DEFAULT 0,
    "trend" TEXT,
    "buys30d" INTEGER NOT NULL DEFAULT 0,
    "sells30d" INTEGER NOT NULL DEFAULT 0,
    "totalBought" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "lastTxAt" TIMESTAMP(3),
    "lastScrapedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhaleWallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "WhaleHistory" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "punkCount" INTEGER NOT NULL,
    "forSaleCount" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhaleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhaleWallet_punkCount_idx" ON "WhaleWallet"("punkCount" DESC);

-- CreateIndex
CREATE INDEX "WhaleHistory_address_scrapedAt_idx" ON "WhaleHistory"("address", "scrapedAt" DESC);

-- CreateIndex
CREATE INDEX "WhaleHistory_scrapedAt_idx" ON "WhaleHistory"("scrapedAt" DESC);

-- AddForeignKey
ALTER TABLE "WhaleHistory" ADD CONSTRAINT "WhaleHistory_address_fkey" FOREIGN KEY ("address") REFERENCES "WhaleWallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;
