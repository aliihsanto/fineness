import { desc, eq } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import {
  computeFinenessScore,
  hourHistogram,
  weeklyTimeline,
  type Commit,
  type MarketMeta,
} from "@fineness/scoring";

export async function computeScore(payload: { repoId: number }) {
  const db = createDb();
  const { repoId } = payload;

  const repo = await db.query.repos.findFirst({ where: eq(schema.repos.id, repoId) });
  if (!repo) throw new Error(`repo ${repoId} not found`);

  const rows = await db
    .select()
    .from(schema.commits)
    .where(eq(schema.commits.repoId, repoId))
    .orderBy(desc(schema.commits.committedAt))
    .limit(300);

  const commits: Commit[] = rows.map((r) => ({
    sha: r.sha,
    authorLogin: r.authorLogin,
    committedAt: r.committedAt,
    additions: r.additions,
    deletions: r.deletions,
    message: r.messageHeadline ?? "",
  }));

  // market context: latest FDV + launch decay, when a token is mapped
  const token = await db.query.tokens.findFirst({ where: eq(schema.tokens.repoId, repoId) });
  let market: MarketMeta = {
    fdv: null,
    launchedAt: null,
    commits7dBeforeLaunch: null,
    commits7dAfterLaunch: null,
    starVelocity7d: null,
  };
  if (token) {
    const snap = await db
      .select()
      .from(schema.marketSnapshots)
      .where(eq(schema.marketSnapshots.tokenId, token.id))
      .orderBy(desc(schema.marketSnapshots.ts))
      .limit(1);
    const launchedAt = token.launchedAt;
    let before: number | null = null;
    let after: number | null = null;
    const oldestCommit = commits[commits.length - 1];
    const week = 7 * 86_400_000;
    // decay is only meaningful when the stored commit window covers the launch —
    // otherwise 0/0 would read as a rug on any token older than the window
    if (launchedAt && oldestCommit && oldestCommit.committedAt.getTime() <= launchedAt.getTime() - week) {
      before = commits.filter(
        (c) => c.committedAt.getTime() >= launchedAt.getTime() - week && c.committedAt.getTime() < launchedAt.getTime(),
      ).length;
      after = commits.filter(
        (c) => c.committedAt.getTime() >= launchedAt.getTime() && c.committedAt.getTime() < launchedAt.getTime() + week,
      ).length;
    }
    market = {
      fdv: snap[0]?.fdv ?? null,
      launchedAt,
      commits7dBeforeLaunch: before,
      commits7dAfterLaunch: after,
      starVelocity7d: await starVelocity(db, repoId),
    };
  } else {
    market.starVelocity7d = await starVelocity(db, repoId);
  }

  const result = computeFinenessScore({
    repo: {
      owner: repo.owner,
      name: repo.name,
      createdAt: repo.createdAtGh ?? repo.firstSeenAt,
      pushedAt: repo.pushedAt ?? repo.firstSeenAt,
      isFork: repo.isFork,
      parentFullName: repo.parentFullName,
      stars: repo.stars,
      forks: repo.forks,
      watchers: repo.watchers,
      openIssues: repo.openIssues,
      manifestName: null, // TODO: fetch package.json name during ingest
      licenseCopyrightHolder: null,
      readmeForeignProjectNames: [],
      fingerprintMatches: 0, // TODO: fingerprint job
      hygiene: { hasTests: repo.hasTests, hasCI: repo.hasCi, hasLockfile: repo.hasLockfile },
      // a full 100-commit window means history was truncated by the scan
      historyComplete: commits.length < 100,
    },
    commits,
    market,
    now: new Date(),
  });

  await db.insert(schema.scores).values({
    repoId,
    algoVersion: result.algoVersion,
    authenticity: result.authenticity.score,
    antislop: result.antislop.score,
    busfactor: result.busFactor.score,
    momentum: result.momentum.score,
    community: result.community.score,
    total: result.total,
    flags: result.flags,
    signals: {
      authenticity: result.authenticity.signals,
      antislop: result.antislop.signals,
      busFactor: result.busFactor.signals,
      momentum: result.momentum.signals,
      community: result.community.signals,
      realityGap: result.realityGap,
      hourHistogram: hourHistogram(commits),
      commitTimeline12w: weeklyTimeline(commits, 12, new Date()),
    },
  });

  return result.total;
}

async function starVelocity(db: ReturnType<typeof createDb>, repoId: number): Promise<number | null> {
  const snaps = await db
    .select()
    .from(schema.repoSnapshots)
    .where(eq(schema.repoSnapshots.repoId, repoId))
    .orderBy(desc(schema.repoSnapshots.ts))
    .limit(8);
  if (snaps.length < 2) return null;
  const newest = snaps[0]!;
  const oldest = snaps[snaps.length - 1]!;
  const days = Math.max((newest.ts.getTime() - oldest.ts.getTime()) / 86_400_000, 1);
  return (newest.stars - oldest.stars) / days;
}
