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
 * AI provenance markers left in commit messages by agent tooling. Presence
 * alone is NOT slop (assisted != dumped) — it only penalizes when the commit
 * pattern independently looks machine-made. See `corroborated` below.
 */
const AI_MARKER =
  /co-authored-by:.*\b(claude|gpt|chatgpt|copilot|cursor|devin|aider|windsurf|codex|gemini)\b|generated (?:with|by) (?:claude|chatgpt|gpt|an? ai|copilot)|🤖 generated/i;

/**
 * Anti-Slop (0-25): did humans build this over time, or was it dumped by an AI in one night?
 *
 * Base weights (sum = 1.00):
 *   0.30 commit-size median   (human median ~30-250 added lines)
 *   0.10 commit-size p95
 *   0.20 burst ratio          (share of gaps < 3 minutes)
 *   0.20 message entropy + prefix diversity
 *   0.10 circadian rhythm     (humans have a >=4h sleep gap)
 *   0.10 engineering hygiene  (tests / CI / lockfile)
 *
 * Provenance forensics (v0.2, subtractive, floor 0):
 *   −0.15 AI co-author markers WHEN the pattern independently looks machine-made
 *   −0.12 whole window dumped in a single <=48h session (small team)
 *   −0.08 exact-duplicate message ratio > 0.8
 *   −0.08 metronome cadence — inter-commit gaps too regular to be a human (small team)
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

  // 6) Provenance forensics — cheap tells that the history was machine-made
  const aiMarkerRatio = human.filter((c) => AI_MARKER.test(c.message)).length / human.length;
  const dupMsgRatio = 1 - new Set(human.map((c) => normalizeMsg(c.message))).size / human.length;

  const gapMean = gaps.reduce((s, g) => s + g, 0) / Math.max(gaps.length, 1);
  const gapVar = gaps.reduce((s, g) => s + (g - gapMean) ** 2, 0) / Math.max(gaps.length, 1);
  const gapCv = gapMean > 0 ? Math.sqrt(gapVar) / gapMean : 0;
  const metronome = gaps.length >= 10 && gapCv < 0.25; // humans don't commit on a fixed clock

  const times = human.map((c) => c.committedAt.getTime());
  const spanHours = (Math.max(...times) - Math.min(...times)) / 3_600_000;
  const singleSession = human.length >= 20 && spanHours <= 48;

  // AI-assisted is fine; AI markers only cost points when the pattern itself is suspicious
  const corroborated = (!sleepGap && authors < 5) || burstRatio > 0.3 || med > 800 || singleSession;
  let slopPenalty = 0;
  if (aiMarkerRatio > 0.3 && corroborated) slopPenalty += 0.15;
  if (singleSession && authors < 3) slopPenalty += 0.12;
  if (dupMsgRatio > 0.8) slopPenalty += 0.08;
  if (metronome && authors < 3) slopPenalty += 0.08;

  const raw = Math.max(0, sizeScore + burstScore + msgScore + circadianScore + hygieneScore - slopPenalty);
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
      aiMarkerRatio: Number(aiMarkerRatio.toFixed(3)),
      dupMsgRatio: Number(dupMsgRatio.toFixed(3)),
      metronome,
      singleSession,
      slopPenalty: Number(slopPenalty.toFixed(2)),
    },
  };
}
