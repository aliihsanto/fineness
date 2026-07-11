import type { Commit, MarketMeta, RepoMeta } from "../../src/types";

/** deterministic PRNG so calibration tests never flake */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NOW = new Date("2026-07-01T12:00:00Z");

const HUMAN_MESSAGES = [
  "fix race condition in queue drain",
  "add retry with exponential backoff to github client",
  "refactor: extract token pool into its own module",
  "handle empty commit history in scorer",
  "docs: explain rate limit strategy",
  "test: cover gini edge cases",
  "chore: bump drizzle to 0.38",
  "fix off-by-one in percentile",
  "wire dexscreener adapter into ingest job",
  "improve OG card rendering for long symbols",
  "remove dead code from snapshot job",
  "feat: fake star anomaly detection",
  "perf: batch snapshot inserts",
  "fix timezone bug in circadian histogram",
  "add lockfile check to hygiene signals",
];

/**
 * Known-real profile: ~60 commits over 90 days, 3 authors, small commits,
 * varied messages, work happens 08:00-22:00 UTC (sleep gap overnight).
 */
export function humanCommits(seed = 42, count = 60): Commit[] {
  const rnd = mulberry32(seed);
  const commits: Commit[] = [];
  let t = NOW.getTime() - 90 * 86_400_000;
  const authors = ["alice-dev", "bob-oss", "carol-hax"];
  for (let i = 0; i < count; i++) {
    // gap: 4h .. 3 days
    t += (4 + rnd() * 68) * 3_600_000;
    const d = new Date(t);
    // clamp into waking hours 08-22 UTC
    const h = d.getUTCHours();
    if (h < 8) d.setUTCHours(8 + Math.floor(rnd() * 4));
    if (h > 22) d.setUTCHours(14 + Math.floor(rnd() * 6));
    const additions = Math.round(10 + rnd() * rnd() * 500); // median well under 250
    commits.push({
      sha: `h${i.toString(16).padStart(6, "0")}`,
      authorLogin: authors[Math.floor(rnd() * (i < 10 ? 1 : 3))]!,
      committedAt: d,
      additions,
      deletions: Math.round(additions * 0.4 * rnd()),
      message: `${HUMAN_MESSAGES[i % HUMAN_MESSAGES.length]!} (${i})`,
    });
  }
  return commits;
}

/**
 * Known-slop profile: 40 commits dumped over ~36 hours, single author,
 * huge commits, templated messages, no sleep gap.
 */
export function slopCommits(seed = 7, count = 40): Commit[] {
  const rnd = mulberry32(seed);
  const commits: Commit[] = [];
  let t = NOW.getTime() - 5 * 86_400_000;
  for (let i = 0; i < count; i++) {
    t += (0.5 + rnd() * 90) * 60_000; // 30s .. 90min, mostly bursts
    commits.push({
      sha: `s${i.toString(16).padStart(6, "0")}`,
      authorLogin: "solodev123",
      committedAt: new Date(t),
      additions: Math.round(600 + rnd() * 9000),
      deletions: Math.round(rnd() * 200),
      message: `feat: add module-${i}`,
    });
  }
  return commits;
}

export function baseRepo(overrides: Partial<RepoMeta> = {}): RepoMeta {
  return {
    owner: "acme",
    name: "acme-agent",
    createdAt: new Date(NOW.getTime() - 95 * 86_400_000),
    pushedAt: new Date(NOW.getTime() - 1 * 86_400_000),
    isFork: false,
    parentFullName: null,
    stars: 800,
    forks: 60,
    watchers: 45,
    openIssues: 30,
    manifestName: "acme-agent",
    licenseCopyrightHolder: "acme",
    readmeForeignProjectNames: [],
    fingerprintMatches: 0,
    hygiene: { hasTests: true, hasCI: true, hasLockfile: true },
    historyComplete: true,
    ...overrides,
  };
}

export function baseMarket(overrides: Partial<MarketMeta> = {}): MarketMeta {
  return {
    fdv: 2_000_000,
    launchedAt: new Date(NOW.getTime() - 30 * 86_400_000),
    commits7dBeforeLaunch: 25,
    commits7dAfterLaunch: 20,
    starVelocity7d: 4,
    ...overrides,
  };
}
