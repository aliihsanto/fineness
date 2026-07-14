import { createDb } from "@fineness/db";
import {
  cgSleep,
  discoverDexProfiles,
  fetchLlamaProtocols,
  fetchTokenQuote,
  hydrateCoin,
  listCategoryCoins,
} from "@fineness/market";
import type { CategoryCoin } from "@fineness/market";
import { GithubClient } from "@fineness/github";
import { autoMap } from "./map-auto";

/**
 * DefiLlama discovery — free and keyless. ~850 protocols ship a token address
 * plus a GitHub org; we resolve each org to its most-starred repo and run the
 * standard pipeline. TVL-ordered, so a limit takes the most established first.
 */
export async function discoverLlama(limit = 300): Promise<number> {
  const db = createDb();
  const gh = GithubClient.fromEnv();
  const protocols = (await fetchLlamaProtocols()).slice(0, limit);
  console.log(`[discover] defillama: ${protocols.length} protocol(s) with github + address`);

  let created = 0;
  let processed = 0;
  for (const p of protocols) {
    processed++;
    let repo: { owner: string; name: string } | null = null;
    try {
      repo = await gh.topRepo(p.githubOrg);
    } catch (err) {
      console.warn(`[discover] top-repo lookup failed for ${p.githubOrg}:`, (err as Error).message);
    }
    if (!repo) continue;
    const ok = await autoMap(db, {
      chain: p.chain,
      address: p.address,
      symbol: p.symbol,
      name: p.name,
      repoOwner: repo.owner,
      repoName: repo.name,
      platform: "other",
      source: "defillama",
    });
    if (ok) created++;
    if (processed % 25 === 0) console.log(`[discover] defillama progress ${processed}/${protocols.length} — ${created} new`);
    await cgSleep(700); // gentle on dexscreener/github, still ~85/min
  }
  console.log(`[discover] defillama done — ${created} new of ${protocols.length}`);
  return created;
}

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

/** builder-heavy CoinGecko categories — the ones whose coins actually link a repo */
export const CG_CATEGORIES = [
  "ai-agents",
  "artificial-intelligence",
  "smart-contract-platform",
  "layer-1",
  "layer-2",
  "infrastructure",
  "decentralized-finance-defi",
  "decentralized-exchange",
  "oracle",
  "depin",
  "zero-knowledge-zk",
  "storage",
  "interoperability",
  "data-availability",
];

/**
 * CoinGecko discovery — daily cron and bulk backfills. Coins are collected
 * across all categories first and deduped by id, so a coin sitting in three
 * categories costs one detail call, then each is mapped into the ledger the
 * moment it hydrates — a long run grows the site incrementally.
 */
export async function discoverCoingecko(categories = CG_CATEGORIES, limit = 100, throttleMs = 15_000) {
  const db = createDb();

  const seen = new Set<string>();
  const queue: CategoryCoin[] = [];
  for (const category of categories) {
    await cgSleep(throttleMs);
    let coins: CategoryCoin[];
    try {
      coins = await listCategoryCoins(category, limit);
    } catch (err) {
      console.warn(`[discover] coingecko category ${category} failed:`, (err as Error).message);
      continue;
    }
    let fresh = 0;
    for (const m of coins) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      queue.push(m);
      fresh++;
    }
    console.log(`[discover] coingecko ${category}: ${coins.length} coins, ${fresh} new to this run`);
  }
  console.log(`[discover] coingecko: ${queue.length} unique coins to hydrate (~${Math.round((queue.length * throttleMs) / 60_000)} min)`);

  let created = 0;
  let processed = 0;
  const mapCoin = async (m: CategoryCoin): Promise<boolean | null> => {
    const coin = await hydrateCoin(m);
    if (coin === null) return null; // hydration failed (usually 429) — retryable
    if (!coin.github) return false;
    const chains = Object.entries(coin.contracts);
    if (chains.length === 0) return false; // native-chain coins can't be quoted via DexScreener
    const [chain, address] = chains[0]!;
    return autoMap(db, {
      chain,
      address,
      symbol: coin.symbol,
      name: coin.name,
      repoOwner: coin.github.owner,
      repoName: coin.github.name,
      platform: "other",
      source: "coingecko",
    });
  };

  const failed: CategoryCoin[] = [];
  for (const m of queue) {
    await cgSleep(throttleMs);
    processed++;
    const ok = await mapCoin(m);
    if (ok === null) failed.push(m);
    else if (ok) created++;
    if (processed % 25 === 0) console.log(`[discover] coingecko progress ${processed}/${queue.length} — ${created} new`);
  }

  // rate-limited coins get a second, slower pass instead of silently dropping
  if (failed.length > 0) {
    console.log(`[discover] coingecko retrying ${failed.length} rate-limited coin(s) at ${(throttleMs * 2) / 1000}s pace`);
    for (const m of failed) {
      await cgSleep(throttleMs * 2);
      if (await mapCoin(m)) created++;
    }
  }
  console.log(`[discover] coingecko done — ${created} new of ${queue.length} coins`);
  return created;
}
