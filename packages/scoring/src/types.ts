export type Commit = {
  sha: string;
  authorLogin: string | null;
  committedAt: Date;
  additions: number;
  deletions: number;
  message: string;
};

export type RepoHygiene = {
  hasTests: boolean;
  hasCI: boolean;
  hasLockfile: boolean;
};

export type RepoMeta = {
  owner: string;
  name: string;
  createdAt: Date;
  pushedAt: Date;
  isFork: boolean;
  parentFullName: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  /** package.json "name" field, if any manifest exists at repo root */
  manifestName: string | null;
  /** copyright holder parsed from LICENSE, if any */
  licenseCopyrightHolder: string | null;
  /** distinct project names mentioned in README that are not this repo */
  readmeForeignProjectNames: string[];
  /** how many indexed files hash-match a known popular repo (hidden fork detection) */
  fingerprintMatches: number;
  hygiene: RepoHygiene;
  /**
   * true only when the commit window reaches the genesis commit.
   * First-commit-based checks (dump, erased history) are skipped otherwise —
   * a 100-commit window on an active repo starts nowhere near the beginning.
   */
  historyComplete?: boolean;
};

export type MarketMeta = {
  fdv: number | null;
  launchedAt: Date | null;
  /** commits in the 7 days before / after launch, when known */
  commits7dBeforeLaunch: number | null;
  commits7dAfterLaunch: number | null;
  /** star velocity: stars gained per day over last 7d, if snapshots exist */
  starVelocity7d: number | null;
};

export type ScoreInput = {
  repo: RepoMeta;
  commits: Commit[];
  market: MarketMeta;
  /** "now" injected for deterministic tests */
  now: Date;
};

export type SubScore = {
  score: number;
  max: number;
  signals: Record<string, number | string | boolean | null>;
};

export type Flag =
  | "FORK"
  | "AI_SLOP"
  | "RUG_WATCH"
  | "DEAD"
  | "SOLO"
  | "FAKE_STARS"
  | "SHIPPING";

export type ScoreResult = {
  algoVersion: string;
  total: number; // 0-100
  authenticity: SubScore; // /30
  antislop: SubScore; // /25
  busFactor: SubScore; // /15
  momentum: SubScore; // /20
  community: SubScore; // /10
  flags: Flag[];
  /** FDV / max(total, 1) — leaderboard default sort */
  realityGap: number | null;
};
