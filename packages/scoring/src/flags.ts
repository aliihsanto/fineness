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
  if (antislop.score < 8) flags.push("AI_SLOP");

  if (
    market.commits7dBeforeLaunch !== null &&
    market.commits7dAfterLaunch !== null &&
    market.commits7dAfterLaunch / Math.max(market.commits7dBeforeLaunch, 1) < 0.2
  ) {
    flags.push("RUG_WATCH");
  }

  const daysSincePush = (now.getTime() - repo.pushedAt.getTime()) / 86_400_000;
  if (daysSincePush >= 14) flags.push("DEAD");

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
