import { createDb } from "@fineness/db";
import { discoverCategory, discoverDexProfiles, fetchTokenQuote } from "@fineness/market";
import { autoMap } from "./map-auto";

/**
 * DexScreener discovery — every 30 min. Latest token profiles/boosts whose
 * links include a GitHub repo get pulled through the full pipeline.
 */
export async function discoverDex(): Promise<number> {
  const db = createDb();
  const candidates = await discoverDexProfiles();
  console.log(`[discover] dexscreener: ${candidates.length} candidate(s) with a github link`);

  let created = 0;
  for (const c of candidates) {
    const quote = await fetchTokenQuote(c.chain, c.address).catch(() => null);
    const ok = await autoMap(db, {
      chain: c.chain,
      address: c.address,
      symbol: quote?.baseSymbol ?? c.address.slice(0, 6),
      name: quote?.baseName ?? null,
      repoOwner: c.github.owner,
      repoName: c.github.name,
      platform: "other",
      source: "dexscreener profile",
    });
    if (ok) created++;
  }
  console.log(`[discover] dexscreener done — ${created} new`);
  return created;
}

/**
 * CoinGecko discovery — daily. AI categories carry GitHub links in coin
 * metadata; this back-fills the established-token side of the ledger.
 */
export async function discoverCoingecko(categories = ["ai-agents", "artificial-intelligence"], limit = 30) {
  const db = createDb();
  let created = 0;
  for (const category of categories) {
    let coins;
    try {
      coins = await discoverCategory(category, limit);
    } catch (err) {
      console.warn(`[discover] coingecko category ${category} failed:`, (err as Error).message);
      continue;
    }
    console.log(`[discover] coingecko ${category}: ${coins.length} coins`);
    for (const coin of coins) {
      if (!coin.github) continue;
      const chains = Object.entries(coin.contracts);
      if (chains.length === 0) continue; // native-chain coins can't be quoted via DexScreener
      const [chain, address] = chains[0]!;
      const ok = await autoMap(db, {
        chain,
        address,
        symbol: coin.symbol,
        name: coin.name,
        repoOwner: coin.github.owner,
        repoName: coin.github.name,
        platform: "other",
        source: `coingecko ${category}`,
      });
      if (ok) created++;
    }
  }
  console.log(`[discover] coingecko done — ${created} new`);
  return created;
}
