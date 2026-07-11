import { t, type Lang } from "./i18n";
import type { LeaderboardEntry } from "./types";

/**
 * Human-readable findings derived from raw signals — what an assayer would
 * write in the margin. Every line is backed by a number shown elsewhere.
 */
export function assayNotes(e: LeaderboardEntry, lang: Lang): { text: string; good: boolean }[] {
  const T = t(lang).notes;
  const s = e.signals as Record<string, unknown>;
  const notes: { text: string; good: boolean }[] = [];
  const num = (k: string) => (typeof s[k] === "number" ? (s[k] as number) : null);
  const fmt = (n: number) => n.toLocaleString("en-US");

  const parent = typeof s.parent === "string" ? s.parent : null;
  if (e.flags.includes("FORK")) {
    notes.push({ text: parent ? T.fork(parent) : T.hiddenFork, good: false });
  }

  const firstDump = num("firstCommitAdditions");
  if (firstDump && firstDump >= 5000) {
    notes.push({ text: T.firstDump(fmt(firstDump)), good: false });
  }

  const median = num("medianAdditions");
  if (median !== null) {
    if (median > 800) notes.push({ text: T.medianHigh(fmt(median)), good: false });
    else if (median <= 250) notes.push({ text: T.medianOk(median), good: true });
  }

  const burst = num("burstRatio");
  if (burst !== null && burst >= 0.4) {
    notes.push({ text: T.burst(Math.round(burst * 100)), good: false });
  }

  if (s.sleepGap === false) notes.push({ text: T.noSleep, good: false });
  else if (s.sleepGap === true) notes.push({ text: T.sleep, good: true });

  if (e.decayRatio !== null) {
    if (e.decayRatio < 0.2) notes.push({ text: T.decayBad(Math.round(e.decayRatio * 100)), good: false });
    else if (e.decayRatio >= 1) notes.push({ text: T.decayGood, good: true });
  }

  const anomaly = num("anomalyRatio");
  if (e.flags.includes("FAKE_STARS") && anomaly !== null) {
    notes.push({
      text: T.fakeStars(fmt(e.stars), e.forks, e.openIssues, Math.round(anomaly)),
      good: false,
    });
  }

  if (e.lastCommitDaysAgo >= 14) notes.push({ text: T.stale(e.lastCommitDaysAgo), good: false });

  if (e.uniqueAuthors30d <= 1) notes.push({ text: T.solo, good: false });
  else if (e.uniqueAuthors30d >= 3) notes.push({ text: T.team(e.uniqueAuthors30d), good: true });

  if (e.flags.includes("SHIPPING")) notes.push({ text: T.shipping, good: true });

  return notes;
}
