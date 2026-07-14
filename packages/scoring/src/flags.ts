import type { Commit, Flag, MarketMeta, RepoMeta, SubScore } from "./types";
import { hasFakeStarAnomaly } from "./community";
import { isBot } from "./utils";

export function computeFlags(args: {
  repo: RepoMeta;
  commits: Commit[];
  market: MarketMeta;
  antislop: SubScore;
  busFactorAuthors: number;
  now: Date;
}): Flag[] {
  const { repo, commits, market, antislop, busFactorAuthors, now } = args;
  const flags: Flag[] = [];

  if (repo.isFork || repo.fingerprintMatches >= 5) flags.push("FORK");
  // rock-bottom anti-slop, or corroborated provenance forensics fired (v0.2)
  if (antislop.score < 8 || Number(antislop.signals.slopPenalty ?? 0) >= 0.15) flags.push("AI_SLOP");

  if (
    market.commits7dBeforeLaunch !== null &&
    market.commits7dAfterLaunch !== null &&
    market.commits7dAfterLaunch / Math.max(market.commits7dBeforeLaunch, 1) < 0.2
  ) {
    flags.push("RUG_WATCH");
  }

  // DEAD is maturity-aware: a 2-week-quiet fresh launch is dead, a 2-week-quiet
  // 3-year-old protocol is just finished software. 14d (young) → 60d (mature).
  const ageDays = (now.getTime() - repo.createdAt.getTime()) / 86_400_000;
  const deadAfterDays = Math.min(60, Math.max(14, ageDays / 12));
  const daysSincePush = (now.getTime() - repo.pushedAt.getTime()) / 86_400_000;
  if (daysSincePush >= deadAfterDays) flags.push("DEAD");

  if (busFactorAuthors === 1) flags.push("SOLO");
  if (hasFakeStarAnomaly(repo)) flags.push("FAKE_STARS");

  // SHIPPING: commit in last 48h + 3 or more distinct human contributors overall.
  // Never on forks — inherited upstream commits aren't this team shipping.
  if (flags.includes("FORK")) return flags;
  const cutoff48h = now.getTime() - 48 * 3_600_000;
  const recentCommit = commits.some(
    (c) => !isBot(c.authorLogin) && c.committedAt.getTime() >= cutoff48h,
  );
  const contributors = new Set(
    commits.filter((c) => !isBot(c.authorLogin) && c.authorLogin).map((c) => c.authorLogin),
  ).size;
  if (recentCommit && contributors >= 3) flags.push("SHIPPING");

  return flags;
}
