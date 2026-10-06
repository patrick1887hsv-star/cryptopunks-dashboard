-- Rename buys30d -> buys12m and sells30d -> sells12m on WhaleWallet
ALTER TABLE "WhaleWallet" RENAME COLUMN "buys30d" TO "buys12m";
ALTER TABLE "WhaleWallet" RENAME COLUMN "sells30d" TO "sells12m";
