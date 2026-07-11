import type { ScoreInput, ScoreResult } from "./types";
import { authenticityScore } from "./authenticity";
import { antiSlopScore } from "./antislop";
import { busFactorScore } from "./busfactor";
import { momentumScore } from "./momentum";
import { communityScore } from "./community";
import { computeFlags } from "./flags";

export const ALGO_VERSION = "0.1.0";

/**
 * Fineness Score (0-100) = Authenticity/30 + Anti-Slop/25 + Bus Factor/15
 *                        + Momentum/20 + Community/10
 */
export function computeFinenessScore(input: ScoreInput): ScoreResult {
  const { repo, commits, market, now } = input;

  const authenticity = authenticityScore(repo, commits);
  const antislop = antiSlopScore(commits, repo.hygiene);
  const busFactor = busFactorScore(commits, now);
  const momentum = momentumScore(repo, commits, market, now);
  const community = communityScore(repo, market);

  const total = Math.max(
    0,
    Math.min(100, authenticity.score + antislop.score + busFactor.score + momentum.score + community.score),
  );

  const flags = computeFlags({
    repo,
    commits,
    market,
    antislop,
    busFactorAuthors: Number(busFactor.signals.uniqueAuthors ?? 0),
    now,
  });

  const realityGap = market.fdv === null ? null : Math.round(market.fdv / Math.max(total, 1));

  return {
    algoVersion: ALGO_VERSION,
    total,
    authenticity,
    antislop,
    busFactor,
    momentum,
    community,
    flags,
    realityGap,
  };
}

export * from "./types";
export { authenticityScore } from "./authenticity";
export { antiSlopScore } from "./antislop";
export { busFactorScore } from "./busfactor";
export { momentumScore } from "./momentum";
export { communityScore, hasFakeStarAnomaly, starAnomalyRatio } from "./community";
export { computeFlags } from "./flags";
export { hourHistogram, weeklyTimeline } from "./histograms";
export * as scoringUtils from "./utils";
