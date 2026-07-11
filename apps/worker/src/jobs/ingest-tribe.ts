import { and, eq, sql } from "drizzle-orm";
import { createDb, schema, type Db } from "@fineness/db";
import { SolanaRpc, fetchRecentLaunches, fetchTokenMeta, type TribeLaunch } from "@fineness/tribe";
import { ingestGithub } from "./ingest-github";
import { ingestMarket } from "./ingest-market";
import { computeScore } from "./compute-score";

const SWEEP_CURSOR = "tribe:newest-signature";

export async function getCursor(db: Db, key: string): Promise<string | null> {
  const row = await db.query.scanCursors.findFirst({ where: eq(schema.scanCursors.key, key) });
  return row?.value ?? null;
}

export async function setCursor(db: Db, key: string, value: string): Promise<void> {
  await db
    .insert(schema.scanCursors)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.scanCursors.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Process one on-chain launch: metadata → token row; a github.com link in the
 * metadata → automatic repo scan + score + market quote. Idempotent by mint.
 * Returns true when a new token row was created.
 */
export async function processLaunch(db: Db, rpc: SolanaRpc, launch: TribeLaunch): Promise<boolean> {
  const existing = await db.query.tokens.findFirst({
    where: and(eq(schema.tokens.chain, "solana"), eq(schema.tokens.mintAddress, launch.mint)),
  });
  if (existing) return false;

  const meta = await fetchTokenMeta(rpc, launch.mint);
  const symbol = (meta.symbol ?? launch.mint.slice(0, 6)).toUpperCase();

  let repoId: number | null = null;
  if (meta.githubRepo) {
    try {
      repoId = await ingestGithub({ owner: meta.githubRepo.owner, name: meta.githubRepo.name });
    } catch (err) {
      console.warn(`[tribe] repo scan failed for ${symbol}:`, (err as Error).message);
    }
  }

  const [token] = await db
    .insert(schema.tokens)
    .values({
      chain: "solana",
      mintAddress: launch.mint,
      symbol,
      name: meta.name,
      platform: "tribe",
      repoId,
      launchedAt: launch.blockTime,
      verified: repoId !== null,
      verificationSource: repoId !== null ? `on-chain metadata ${launch.signature}` : null,
    })
    .onConflictDoNothing()
    .returning({ id: schema.tokens.id });
  if (!token) return false;

  if (repoId !== null) {
    await ingestMarket({ tokenId: token.id }).catch((err) =>
      console.warn(`[tribe] market quote failed for ${symbol}:`, (err as Error).message),
    );
    await computeScore({ repoId });
    console.log(`[tribe] +$${symbol} → ${meta.githubRepo!.owner}/${meta.githubRepo!.name} (scored)`);
  } else {
    await db.insert(schema.submissions).values({
      mintAddress: launch.mint,
      repoUrl: meta.website ?? "",
      submittedBy: "tribe-scanner",
      status: "pending",
    });
    console.log(`[tribe] +$${symbol} (no repo link — sent to submissions)`);
  }
  return true;
}

/**
 * Incremental sweep for new launches. Walks every signature since the stored
 * cursor (so bursts bigger than one page are never missed), then advances it.
 */
export async function ingestTribe(opts: { limit?: number } = {}) {
  const db = createDb();
  const rpc = new SolanaRpc();

  const until = await getCursor(db, SWEEP_CURSOR);
  const { launches, newestSignature } = await fetchRecentLaunches(rpc, {
    limit: opts.limit ?? (until ? 5000 : 100),
    until: until ?? undefined,
    throttleMs: 60,
  });
  console.log(`[tribe] ${launches.length} CreateToken launches since cursor`);

  let created = 0;
  for (const launch of launches) {
    if (await processLaunch(db, rpc, launch)) created++;
  }

  if (newestSignature) await setCursor(db, SWEEP_CURSOR, newestSignature);
  console.log(`[tribe] sweep done — ${created} new token(s)`);
  return created;
}
