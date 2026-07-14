/**
 * Manual discovery run:
 *   pnpm --filter @fineness/worker discover dex          # dexscreener profiles/boosts
 *   pnpm --filter @fineness/worker discover coingecko [limit] [throttleMs]
 */
import { discoverCoingecko, discoverDex, discoverLlama } from "./jobs/discover";

const mode = process.argv[2] ?? "dex";
if (mode === "coingecko") {
  await discoverCoingecko(undefined, Number(process.argv[3] ?? 100), Number(process.argv[4] ?? 15_000));
} else if (mode === "llama") {
  await discoverLlama(Number(process.argv[3] ?? 300));
} else {
  await discoverDex();
}
process.exit(0);
