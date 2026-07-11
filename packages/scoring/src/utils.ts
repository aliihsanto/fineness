import type { Commit } from "./types";

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function median(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0;
  return sortedAsc[Math.floor(sortedAsc.length / 2)]!;
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
  return sortedAsc[idx]!;
}

const BOT_PATTERNS = [/\[bot\]$/i, /^dependabot/i, /^renovate/i, /^github-actions/i, /-bot$/i];

export function isBot(login: string | null): boolean {
  if (!login) return false;
  return BOT_PATTERNS.some((p) => p.test(login));
}

/** lowercase, strip digits/hashes/paths so templated messages collapse to one bucket */
export function normalizeMsg(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[0-9]+/g, "#")
    .replace(/[`'"()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Shannon entropy (bits) over the distribution of values */
export function shannonEntropy(values: string[]): number {
  if (values.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const n = values.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

/** count of distinct first tokens of commit messages ("feat:", "fix", "add", ...) */
export function uniquePrefixes(commits: Commit[]): number {
  const set = new Set<string>();
  for (const c of commits) {
    const first = c.message.trim().toLowerCase().split(/\s+/)[0] ?? "";
    set.add(first.replace(/[:!.]$/, ""));
  }
  return set.size;
}

/** minutes between consecutive commits, sorted by time */
export function pairwiseGapsMinutes(commits: Commit[]): number[] {
  const times = commits.map((c) => c.committedAt.getTime()).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    gaps.push((times[i]! - times[i - 1]!) / 60_000);
  }
  return gaps;
}

/**
 * Circadian rhythm: humans sleep. Build a 24h UTC-hour histogram and look for
 * a contiguous block of >= 4 empty hours (wrapping around midnight).
 */
export function hasSleepGap(commits: Commit[]): boolean {
  if (commits.length < 10) return false;
  const hist = new Array<number>(24).fill(0);
  for (const c of commits) hist[c.committedAt.getUTCHours()]!++;
  let best = 0;
  let run = 0;
  // scan twice around the clock to catch wrap-around gaps
  for (let i = 0; i < 48; i++) {
    if (hist[i % 24] === 0) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best >= 4;
}

/** Gini coefficient of contribution counts. 0 = perfectly equal, 1 = one person does everything. */
export function gini(counts: number[]): number {
  const xs = counts.filter((c) => c > 0).sort((a, b) => a - b);
  const n = xs.length;
  if (n <= 1) return 0;
  const sum = xs.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let weighted = 0;
  for (let i = 0; i < n; i++) weighted += (i + 1) * xs[i]!;
  return (2 * weighted) / (n * sum) - (n + 1) / n;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}
