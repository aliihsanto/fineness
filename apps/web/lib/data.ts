import { DEMO_ENTRIES } from "./demo-data";
import type { LeaderboardEntry } from "./types";

export type SortKey = "gap" | "fineness" | "fdv" | "volume";

/**
 * Data access layer. Reads from Postgres when DATABASE_URL is set,
 * otherwise serves the demo dataset so the UI is never empty.
 */
export async function getLeaderboard(sort: SortKey = "gap"): Promise<LeaderboardEntry[]> {
  const fromDb = await tryDb();
  const entries = [...(fromDb ?? DEMO_ENTRIES)];
  switch (sort) {
    case "fineness":
      // worst first — the product thesis is finding impurity
      entries.sort((a, b) => a.total - b.total);
      break;
    case "fdv":
      entries.sort((a, b) => (b.fdv ?? -1) - (a.fdv ?? -1));
      break;
    case "volume":
      entries.sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1));
      break;
    default:
      entries.sort((a, b) => (b.realityGap ?? -1) - (a.realityGap ?? -1));
  }
  return entries;
}

export async function getEntryBySymbol(symbol: string): Promise<LeaderboardEntry | null> {
  const all = await getLeaderboard();
  return all.find((e) => e.symbol.toLowerCase() === symbol.toLowerCase()) ?? null;
}

export async function getEntryByRepo(owner: string, repo: string): Promise<LeaderboardEntry | null> {
  const all = await getLeaderboard();
  return all.find((e) => e.repoFullName.toLowerCase() === `${owner}/${repo}`.toLowerCase()) ?? null;
}

export async function getStats() {
  const all = await getLeaderboard();
  const pct = (f: (e: LeaderboardEntry) => boolean) =>
    Math.round((all.filter(f).length / Math.max(all.length, 1)) * 100);
  const totals = all.map((e) => e.total).sort((a, b) => a - b);
  const medianScore = totals[Math.floor(totals.length / 2)] ?? 0;
  const totalFdv = all.reduce((sum, e) => sum + (e.fdv ?? 0), 0);
  return {
    reposScanned: all.length,
    medianFinenessScore: medianScore,
    totalFdv,
    forkPct: pct((e) => e.flags.includes("FORK")),
    deadPct: pct((e) => e.flags.includes("DEAD")),
    slopPct: pct((e) => e.flags.includes("AI_SLOP")),
    soloPct: pct((e) => e.flags.includes("SOLO")),
    shippingPct: pct((e) => e.flags.includes("SHIPPING")),
    demo: all.every((e) => e.demo),
  };
}

async function tryDb(): Promise<LeaderboardEntry[] | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { createDb, schema } = await import("@fineness/db");
    const { desc, eq } = await import("drizzle-orm");
    const db = createDb();

    const repos = await db.select().from(schema.repos);
    if (repos.length === 0) return null;

    const entries: LeaderboardEntry[] = [];
    for (const repo of repos) {
      const [score] = await db
        .select()
        .from(schema.scores)
        .where(eq(schema.scores.repoId, repo.id))
        .orderBy(desc(schema.scores.computedAt))
        .limit(1);
      if (!score) continue;

      const token = await db.query.tokens.findFirst({
        where: eq(schema.tokens.repoId, repo.id),
      });
      let market: {
        fdv: number | null;
        price: number | null;
        mcap: number | null;
        volume24h: number | null;
        liquidity: number | null;
        holders: number | null;
      } = { fdv: null, price: null, mcap: null, volume24h: null, liquidity: null, holders: null };
      if (token) {
        const [snap] = await db
          .select()
          .from(schema.marketSnapshots)
          .where(eq(schema.marketSnapshots.tokenId, token.id))
          .orderBy(desc(schema.marketSnapshots.ts))
          .limit(1);
        if (snap) {
          market = {
            fdv: snap.fdv,
            price: snap.price,
            mcap: snap.mcap,
            volume24h: snap.volume24h,
            liquidity: snap.liquidity,
            holders: snap.holders,
          };
        }
      }

      const [latestSnap] = await db
        .select()
        .from(schema.repoSnapshots)
        .where(eq(schema.repoSnapshots.repoId, repo.id))
        .orderBy(desc(schema.repoSnapshots.ts))
        .limit(1);

      const lastCommitDaysAgo = repo.pushedAt
        ? Math.floor((Date.now() - repo.pushedAt.getTime()) / 86_400_000)
        : 999;
      const signals = score.signals as Record<string, unknown>;
      const momentumSignals = (signals.momentum ?? {}) as Record<string, unknown>;

      entries.push({
        symbol: token?.symbol ?? repo.name.toUpperCase().slice(0, 10),
        tokenName: token?.name ?? repo.name,
        chain: token?.chain ?? "-",
        platform: token?.platform ?? "-",
        repoFullName: `${repo.owner}/${repo.name}`,
        mintAddress: token?.mintAddress ?? null,
        fdv: market.fdv,
        priceUsd: market.price,
        mcap: market.mcap,
        volume24h: market.volume24h,
        liquidity: market.liquidity,
        holders: market.holders,
        launchedDaysAgo: token?.launchedAt
          ? Math.floor((Date.now() - token.launchedAt.getTime()) / 86_400_000)
          : null,
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        openIssues: repo.openIssues,
        language: repo.language,
        license: repo.license,
        ageDays: repo.createdAtGh
          ? Math.floor((Date.now() - repo.createdAtGh.getTime()) / 86_400_000)
          : 0,
        commits30d: latestSnap?.commits30d ?? 0,
        uniqueAuthors30d: latestSnap?.uniqueAuthors30d ?? 0,
        decayRatio: typeof momentumSignals.decayRatio === "number" ? momentumSignals.decayRatio : null,
        total: score.total,
        authenticity: score.authenticity,
        antislop: score.antislop,
        busfactor: score.busfactor,
        momentum: score.momentum,
        community: score.community,
        flags: score.flags,
        realityGap: market.fdv === null ? null : Math.round(market.fdv / Math.max(score.total, 1)),
        lastCommitDaysAgo,
        commitTimeline: Array.isArray(signals.commitTimeline12w) ? (signals.commitTimeline12w as number[]) : [],
        hourHistogram: Array.isArray(signals.hourHistogram) ? (signals.hourHistogram as number[]) : [],
        signals,
      });
    }
    // tokenless repos fall back to repo-name symbols — disambiguate collisions with the owner
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.symbol, (counts.get(e.symbol) ?? 0) + 1);
    for (const e of entries) {
      if ((counts.get(e.symbol) ?? 0) > 1) {
        const owner = e.repoFullName.split("/")[0] ?? "";
        e.symbol = `${e.symbol}.${owner.toUpperCase().slice(0, 12)}`;
      }
    }
    return entries.length > 0 ? entries : null;
  } catch (err) {
    console.warn("[data] DB unavailable, serving demo data:", (err as Error).message);
    return null;
  }
}
