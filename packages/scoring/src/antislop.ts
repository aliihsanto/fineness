import type { Commit, RepoHygiene, SubScore } from "./types";
import {
  clamp01,
  hasSleepGap,
  isBot,
  median,
  normalizeMsg,
  pairwiseGapsMinutes,
  percentile,
  shannonEntropy,
  uniquePrefixes,
} from "./utils";

const MAX = 25;

/**
 * Anti-Slop (0-25): did humans build this over time, or was it dumped by an AI in one night?
 *
 * Weights (sum = 1.00):
 *   0.30 commit-size median   (human median ~30-250 added lines)
 *   0.10 commit-size p95
 *   0.20 burst ratio          (share of gaps < 3 minutes)
 *   0.20 message entropy + prefix diversity
 *   0.10 circadian rhythm     (humans have a >=4h sleep gap)
 *   0.10 engineering hygiene  (tests / CI / lockfile)
 */
export function antiSlopScore(commits: Commit[], hygiene: RepoHygiene): SubScore {
  const human = commits.filter((c) => !isBot(c.authorLogin));
  if (human.length < 5) {
    return { score: 0, max: MAX, signals: { tooFewCommits: human.length } };
  }

  // 1) Commit size distribution
  const adds = human.map((c) => c.additions).sort((a, b) => a - b);
  const med = median(adds);
  const p95 = percentile(adds, 0.95);
  const sizeScore =
    clamp01(1 - (med > 800 ? 1 : med / 800)) * 0.3 + clamp01(1 - (p95 > 6000 ? 1 : p95 / 6000)) * 0.1;

  // 2) Inter-commit gaps — machine-gun pushes
  const gaps = pairwiseGapsMinutes(human);
  const burstRatio = gaps.filter((g) => g < 3).length / Math.max(gaps.length, 1);
  const burstScore = clamp01(1 - burstRatio * 1.5) * 0.2;

  // 3) Message entropy — all from the same template?
  const entropy = shannonEntropy(human.map((c) => normalizeMsg(c.message)));
  const uniqPrefixRatio = uniquePrefixes(human) / human.length;
  const msgScore = (clamp01(entropy / 4.0) * 0.6 + clamp01(uniqPrefixRatio * 3) * 0.4) * 0.2;

  // 4) Circadian rhythm — a distributed team (5+ authors) legitimately covers
  //    all 24 hours, so the sleep-gap test only applies to small teams
  const authors = new Set(human.map((c) => c.authorLogin).filter(Boolean)).size;
  const sleepGap = hasSleepGap(human);
  const circadianScore = (sleepGap || authors >= 5 ? 1 : 0.3) * 0.1;

  // 5) Engineering hygiene
  const hygieneCount = Number(hygiene.hasTests) + Number(hygiene.hasCI) + Number(hygiene.hasLockfile);
  const hygieneScore = (hygieneCount / 3) * 0.1;

  const raw = sizeScore + burstScore + msgScore + circadianScore + hygieneScore; // 0..1.00
  return {
    score: Math.round(raw * MAX),
    max: MAX,
    signals: {
      medianAdditions: med,
      p95Additions: p95,
      burstRatio: Number(burstRatio.toFixed(3)),
      entropy: Number(entropy.toFixed(3)),
      uniqPrefixRatio: Number(uniqPrefixRatio.toFixed(3)),
      sleepGap,
      distributedTeam: authors >= 5,
      hygieneCount,
    },
  };
}
