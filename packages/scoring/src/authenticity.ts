import type { Commit, RepoMeta, SubScore } from "./types";
import { daysBetween } from "./utils";

const MAX = 30;

/**
 * Authenticity (0-30): is this actually this team's code?
 * Starts at 30 and subtracts per verifiable signal.
 */
export function authenticityScore(repo: RepoMeta, commits: Commit[]): SubScore {
  let score = MAX;
  const signals: SubScore["signals"] = {};

  // GitHub fork flag — hard penalty
  if (repo.isFork) {
    score -= 30;
    signals.isFork = true;
    signals.parent = repo.parentFullName;
  }

  // Hidden fork: file hashes matching a known popular repo corpus
  if (repo.fingerprintMatches >= 5) {
    score -= 25;
    signals.fingerprintMatches = repo.fingerprintMatches;
  }

  // Identity mismatches, -10 each
  const repoNameNorm = repo.name.toLowerCase().replace(/[-_.]/g, "");
  if (repo.manifestName) {
    const manifestNorm = repo.manifestName.toLowerCase().replace(/^@[^/]+\//, "").replace(/[-_.]/g, "");
    if (manifestNorm !== repoNameNorm && !repoNameNorm.includes(manifestNorm) && !manifestNorm.includes(repoNameNorm)) {
      score -= 10;
      signals.manifestNameMismatch = repo.manifestName;
    }
  }
  if (repo.licenseCopyrightHolder) {
    const holder = repo.licenseCopyrightHolder.toLowerCase();
    if (!holder.includes(repo.owner.toLowerCase()) && !repo.owner.toLowerCase().includes(holder)) {
      score -= 10;
      signals.licenseHolderMismatch = repo.licenseCopyrightHolder;
    }
  }
  if (repo.readmeForeignProjectNames.length > 0) {
    score -= 10;
    signals.readmeForeignProjects = repo.readmeForeignProjectNames.join(",");
  }

  // First-commit checks need the genesis commit — skip on truncated windows,
  // where the oldest fetched commit is nowhere near the beginning of history
  const sorted = repo.historyComplete
    ? [...commits].sort((a, b) => a.committedAt.getTime() - b.committedAt.getTime())
    : [];
  const first = sorted[0];

  // First-commit dump: 5000+ lines in the very first commit
  if (first && first.additions >= 5000) {
    score -= 15;
    signals.firstCommitAdditions = first.additions;
  }

  // Erased history: repo created long before/after first commit, or git-init single-commit history
  if (first) {
    const drift = daysBetween(first.committedAt, repo.createdAt);
    if (drift < 0.02 && sorted.length <= 2) {
      // repo created and everything pushed at once
      score -= 10;
      signals.singleShotHistory = true;
    } else if (first.committedAt.getTime() > repo.createdAt.getTime() + 30 * 86_400_000) {
      // history starts way after repo creation → likely rewritten
      score -= 10;
      signals.historyStartsLate = Math.round(drift);
    }
  }

  return { score: Math.max(0, score), max: MAX, signals };
}
