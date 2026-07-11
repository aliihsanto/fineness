import { and, eq, gte, sql } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";

/**
 * ← MOAT. Daily per-repo snapshot. GitHub's API cannot reproduce this history
 * later; a competitor starting in 3 months can never backfill it.
 */
export async function snapshotAll() {
  const db = createDb();
  const repos = await db.select().from(schema.repos);
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86_400_000);
  const d30 = new Date(now.getTime() - 30 * 86_400_000);

  for (const repo of repos) {
    const [c7] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.commits)
      .where(and(eq(schema.commits.repoId, repo.id), gte(schema.commits.committedAt, d7)));
    const [c30] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.commits)
      .where(and(eq(schema.commits.repoId, repo.id), gte(schema.commits.committedAt, d30)));
    const [authors] = await db
      .select({ n: sql<number>`count(distinct ${schema.commits.authorLogin})::int` })
      .from(schema.commits)
      .where(
        and(
          eq(schema.commits.repoId, repo.id),
          gte(schema.commits.committedAt, d30),
          eq(schema.commits.authorIsBot, false),
        ),
      );

    await db.insert(schema.repoSnapshots).values({
      repoId: repo.id,
      stars: repo.stars,
      forks: repo.forks,
      commits7d: c7?.n ?? 0,
      commits30d: c30?.n ?? 0,
      uniqueAuthors30d: authors?.n ?? 0,
      lastPushAt: repo.pushedAt,
    });
  }

  console.log(`[snapshot] ${repos.length} repos snapshotted at ${now.toISOString()}`);
  return repos.length;
}
