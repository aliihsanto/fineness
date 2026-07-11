import type { Commit } from "./types";
import { isBot } from "./utils";

/** commits by hour of day (24 UTC buckets), bots excluded — the circadian fingerprint */
export function hourHistogram(commits: Commit[]): number[] {
  const hist = new Array<number>(24).fill(0);
  for (const c of commits) {
    if (isBot(c.authorLogin)) continue;
    hist[c.committedAt.getUTCHours()]!++;
  }
  return hist;
}

/** weekly commit counts, oldest→newest, bots excluded */
export function weeklyTimeline(commits: Commit[], weeks: number, now = new Date()): number[] {
  const WEEK = 7 * 86_400_000;
  const buckets = new Array<number>(weeks).fill(0);
  for (const c of commits) {
    if (isBot(c.authorLogin)) continue;
    const idx = Math.floor((now.getTime() - c.committedAt.getTime()) / WEEK);
    if (idx >= 0 && idx < weeks) buckets[weeks - 1 - idx]!++;
  }
  return buckets;
}
