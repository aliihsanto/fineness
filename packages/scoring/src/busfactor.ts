import type { Commit, SubScore } from "./types";
import { gini, isBot } from "./utils";

const MAX = 15;

/**
 * Bus Factor (0-15): does this survive one person walking away?
 * busFactor = 15 * (1 - gini) * min(uniqueAuthors / 4, 1), authors from last 90 days.
 */
export function busFactorScore(commits: Commit[], now: Date): SubScore {
  const cutoff = now.getTime() - 90 * 86_400_000;
  const recent = commits.filter((c) => !isBot(c.authorLogin) && c.committedAt.getTime() >= cutoff);

  const byAuthor = new Map<string, number>();
  for (const c of recent) {
    const key = c.authorLogin ?? "(unknown)";
    byAuthor.set(key, (byAuthor.get(key) ?? 0) + 1);
  }
  const uniqueAuthors = byAuthor.size;
  if (uniqueAuthors === 0) {
    return { score: 0, max: MAX, signals: { uniqueAuthors: 0 } };
  }

  const g = gini([...byAuthor.values()]);
  const score = Math.round(MAX * (1 - g) * Math.min(uniqueAuthors / 4, 1));

  return {
    score: Math.max(0, Math.min(MAX, score)),
    max: MAX,
    signals: { uniqueAuthors, gini: Number(g.toFixed(3)) },
  };
}
