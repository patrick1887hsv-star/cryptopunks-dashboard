import cron from "node-cron";
import { runDailyScrape } from "./scraper";

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  // Run every day at 02:00 AM local time
  cron.schedule("0 2 * * *", async () => {
    console.log(`[scheduler] Triggering daily scrape at ${new Date().toISOString()}`);
    try {
      await runDailyScrape();
    } catch (err) {
      console.error("[scheduler] Scrape failed:", err);
    }
  });

  console.log("[scheduler] Daily scrape scheduled at 02:00 AM");
}
