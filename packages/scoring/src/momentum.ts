import type { Commit, MarketMeta, RepoMeta, SubScore } from "./types";
import { clamp01, isBot } from "./utils";

const MAX = 20;

/**
 * Momentum (0-20): is this alive?
 *   10 pts — recency: exp(-daysSinceLastPush / 10)
 *    5 pts — 30-day human commit volume (saturates at 30 commits)
 *    5 pts — post-launch decay ratio (commits 7d after / 7d before launch);
 *            when launch data is unknown, redistributed to recency+volume.
 */
export function momentumScore(
  repo: RepoMeta,
  commits: Commit[],
  market: MarketMeta,
  now: Date,
): SubScore {
  const daysSincePush = Math.max(0, (now.getTime() - repo.pushedAt.getTime()) / 86_400_000);
  const recency = Math.exp(-daysSincePush / 10);

  const cutoff30 = now.getTime() - 30 * 86_400_000;
  const commits30d = commits.filter(
    (c) => !isBot(c.authorLogin) && c.committedAt.getTime() >= cutoff30,
  ).length;
  const volume = clamp01(commits30d / 30);

  let decayRatio: number | null = null;
  if (market.commits7dBeforeLaunch !== null && market.commits7dAfterLaunch !== null) {
    decayRatio = market.commits7dAfterLaunch / Math.max(market.commits7dBeforeLaunch, 1);
  }

  let score: number;
  if (decayRatio !== null) {
    score = recency * 10 + volume * 5 + clamp01(decayRatio) * 5;
  } else {
    score = recency * 13 + volume * 7;
  }

  return {
    score: Math.round(Math.max(0, Math.min(MAX, score))),
    max: MAX,
    signals: {
      daysSincePush: Number(daysSincePush.toFixed(1)),
      commits30d,
      decayRatio: decayRatio === null ? null : Number(decayRatio.toFixed(3)),
    },
  };
}
