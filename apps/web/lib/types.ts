export type LeaderboardEntry = {
  symbol: string;
  tokenName: string;
  chain: string;
  platform: string;
  repoFullName: string;
  /** token mint/contract address — powers the DexScreener link */
  mintAddress: string | null;

  // market
  fdv: number | null;
  priceUsd: number | null;
  mcap: number | null;
  volume24h: number | null;
  liquidity: number | null;
  holders: number | null;
  launchedDaysAgo: number | null;

  // repo
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  ageDays: number;
  commits30d: number;
  uniqueAuthors30d: number;
  decayRatio: number | null;

  // scores
  total: number;
  authenticity: number;
  antislop: number;
  busfactor: number;
  momentum: number;
  community: number;
  flags: string[];
  realityGap: number | null;
  lastCommitDaysAgo: number;
  /** weekly commit counts, oldest→newest, for the sparkline */
  commitTimeline: number[];
  /** commits by hour of day (24 buckets, UTC) — circadian fingerprint; empty = unknown */
  hourHistogram: number[];
  signals: Record<string, unknown>;
  demo?: boolean;
};
