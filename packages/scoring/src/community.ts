import type { MarketMeta, RepoMeta, SubScore } from "./types";
import { clamp01 } from "./utils";

const MAX = 10;

/** stars / (forks + issues + 1) above this ⇒ inorganic star pattern */
export const FAKE_STAR_RATIO_THRESHOLD = 80;
export const FAKE_STAR_MIN_STARS = 200;

export function starAnomalyRatio(repo: RepoMeta): number {
  return repo.stars / (repo.forks + repo.openIssues + 1);
}

export function hasFakeStarAnomaly(repo: RepoMeta): boolean {
  return repo.stars >= FAKE_STAR_MIN_STARS && starAnomalyRatio(repo) > FAKE_STAR_RATIO_THRESHOLD;
}

/**
 * Community (0-10):
 *   6 pts — star velocity (stars/day over last 7d, saturates at 10/day);
 *           falls back to absolute stars (log scale) when no snapshots yet.
 *   4 pts — engagement mix: forks + issues + watchers relative to stars.
 * Fake-star anomaly halves the sub-score (flag is raised separately).
 */
export function communityScore(repo: RepoMeta, market: MarketMeta): SubScore {
  let velocityPart: number;
  if (market.starVelocity7d !== null) {
    velocityPart = clamp01(market.starVelocity7d / 10) * 6;
  } else {
    velocityPart = clamp01(Math.log10(repo.stars + 1) / 4) * 6;
  }

  const engagement = (repo.forks + repo.openIssues + repo.watchers) / Math.max(repo.stars, 1);
  const engagementPart = clamp01(engagement / 0.3) * 4;

  let score = velocityPart + engagementPart;
  const anomaly = hasFakeStarAnomaly(repo);
  if (anomaly) score /= 2;

  return {
    score: Math.round(Math.max(0, Math.min(MAX, score))),
    max: MAX,
    signals: {
      starVelocity7d: market.starVelocity7d,
      stars: repo.stars,
      anomalyRatio: Number(starAnomalyRatio(repo).toFixed(2)),
      fakeStarAnomaly: anomaly,
    },
  };
}
