/**
 * Dev backfill: pull real repos through the full pipeline (no queue needed)
 * and seed 30 days of repo_snapshots so history-dependent features
 * (star velocity, snapshot moat, charts) have data on day one.
 *
 *   GITHUB_TOKENS=... DATABASE_URL=... pnpm --filter @fineness/worker backfill [owner/repo ...]
 *
 * Commit-count columns are computed honestly from stored commit history.
 * Historical star counts are NOT available from GitHub — they are gently
 * interpolated toward today's value and exist only so dev charts render;
 * the daily snapshot cron accretes real history from here on.
 */
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import { ingestGithub } from "./jobs/ingest-github";
import { computeScore } from "./jobs/compute-score";

const DEFAULT_SET = [
  "elizaOS/eliza",
  "vercel/next.js",
  "goat-sdk/goat",
  "sendaifun/solana-agent-kit",
  "coinbase/agentkit",
  "seekdaseek/eliza",
  "yuntiaoOS/eliza",
];

const DAYS = 30;
const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_SET;
const db = createDb();

for (const full of targets) {
  const [owner, name] = full.split("/");
  if (!owner || !name) continue;

  process.stdout.write(`ingest ${full} ... `);
  const repoId = await ingestGithub({ owner, name });
  if (!repoId) {
    console.log("FAILED");
    continue;
  }
  console.log(`repo #${repoId}`);

  const repo = (await db.query.repos.findFirst({ where: eq(schema.repos.id, repoId) }))!;

  // wipe previous backfill for idempotency
  await db.delete(schema.repoSnapshots).where(eq(schema.repoSnapshots.repoId, repoId));

  const now = Date.now();
  const rows = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const ts = new Date(now - d * 86_400_000);
    const from7 = new Date(ts.getTime() - 7 * 86_400_000);
    const from30 = new Date(ts.getTime() - 30 * 86_400_000);

    const [c7] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.commits)
      .where(and(eq(schema.commits.repoId, repoId), gte(schema.commits.committedAt, from7), lte(schema.commits.committedAt, ts)));
    const [c30] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.commits)
      .where(and(eq(schema.commits.repoId, repoId), gte(schema.commits.committedAt, from30), lte(schema.commits.committedAt, ts)));
    const [authors] = await db
      .select({ n: sql<number>`count(distinct ${schema.commits.authorLogin})::int` })
      .from(schema.commits)
      .where(
        and(
          eq(schema.commits.repoId, repoId),
          gte(schema.commits.committedAt, from30),
          lte(schema.commits.committedAt, ts),
          eq(schema.commits.authorIsBot, false),
        ),
      );

    rows.push({
      repoId,
      ts,
      // synthetic star history (see file header) — commit columns are real
      stars: Math.round(repo.stars * (1 - 0.004 * d)),
      forks: Math.round(repo.forks * (1 - 0.003 * d)),
      commits7d: c7?.n ?? 0,
      commits30d: c30?.n ?? 0,
      uniqueAuthors30d: authors?.n ?? 0,
      lastPushAt: repo.pushedAt,
    });
  }
  await db.insert(schema.repoSnapshots).values(rows);

  const total = await computeScore({ repoId });
  console.log(`  ${DAYS} snapshots + score ${total}/100`);
}

console.log("\nbackfill done");
process.exit(0);
