/**
 * Map a real token to a repo and pull live market data:
 *
 *   pnpm --filter @fineness/worker map-token <chain> <mint> <SYMBOL> <owner/repo> [platform] [launchedAt-ISO]
 *
 * Upserts the token, fetches a live DexScreener quote into market_snapshots,
 * then recomputes the repo's score so Reality Gap goes live.
 */
import { and, eq } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import { ingestGithub } from "./jobs/ingest-github";
import { ingestMarket } from "./jobs/ingest-market";
import { computeScore } from "./jobs/compute-score";

const [chain, mint, symbol, repoFull, platform = "other", launchedAtIso] = process.argv.slice(2);
if (!chain || !mint || !symbol || !repoFull) {
  console.error("usage: map-token <chain> <mint> <SYMBOL> <owner/repo> [platform] [launchedAt-ISO]");
  process.exit(1);
}
const [owner, name] = repoFull.split("/");
if (!owner || !name) {
  console.error(`malformed repo: ${repoFull}`);
  process.exit(1);
}

const db = createDb();
let repo = await db.query.repos.findFirst({
  where: and(eq(schema.repos.owner, owner), eq(schema.repos.name, name)),
});
if (!repo) {
  console.log(`repo ${repoFull} not in DB — scanning now`);
  const repoId = await ingestGithub({ owner, name });
  if (!repoId) {
    console.error(`repo ${repoFull} not found on GitHub`);
    process.exit(1);
  }
  repo = (await db.query.repos.findFirst({ where: eq(schema.repos.id, repoId) }))!;
}

const values = {
  chain,
  mintAddress: mint,
  symbol: symbol.toUpperCase(),
  name: symbol,
  platform,
  repoId: repo.id,
  launchedAt: launchedAtIso ? new Date(launchedAtIso) : null,
  verified: false,
  verificationSource: "manual map-token",
};

const [token] = await db
  .insert(schema.tokens)
  .values(values)
  .onConflictDoUpdate({ target: [schema.tokens.chain, schema.tokens.mintAddress], set: values })
  .returning({ id: schema.tokens.id });

console.log(`token #${token!.id} $${values.symbol} → ${repoFull}`);

const fdv = await ingestMarket({ tokenId: token!.id });
console.log(`live quote: FDV ${fdv === null ? "n/a" : `$${Math.round(fdv).toLocaleString("en-US")}`}`);

const total = await computeScore({ repoId: repo.id });
console.log(`score recomputed: ${total}/100`);
if (fdv !== null) {
  console.log(`reality gap: $${Math.round(fdv / Math.max(total, 1)).toLocaleString("en-US")}/pt`);
}
process.exit(0);
