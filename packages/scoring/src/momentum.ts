import type { Commit, MarketMeta, RepoMeta, SubScore } from "./types";
import { clamp01, isBot } from "./utils";

const MAX = 20;

/**
 * Momentum (0-20): is this alive?
 *   10 pts — recency: exp(-daysSinceLastPush / τ), where τ is maturity-aware —
 *            a fresh repo goes stale in days (τ=10), a 3-year-old protocol
 *            earns a slower clock (τ up to 40). Finished software isn't dead.
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
  const ageDays = Math.max(0, (now.getTime() - repo.createdAt.getTime()) / 86_400_000);
  const tau = 10 + Math.min(ageDays / 365, 3) * 10;
  const daysSincePush = Math.max(0, (now.getTime() - repo.pushedAt.getTime()) / 86_400_000);
  const recency = Math.exp(-daysSincePush / tau);

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
      recencyTauDays: Number(tau.toFixed(1)),
      commits30d,
      decayRatio: decayRatio === null ? null : Number(decayRatio.toFixed(3)),
    },
  };
}
