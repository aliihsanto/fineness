import type { LeaderboardEntry } from "./types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fineness.xyz";

export const API_CORS = { "access-control-allow-origin": "*" };

/** Lean, stable public shape — the website's internal entry type can churn, this shouldn't. */
export function toPublicEntry(e: LeaderboardEntry) {
  return {
    symbol: e.symbol,
    name: e.tokenName,
    chain: e.chain,
    platform: e.platform,
    repo: e.repoFullName,
    mintAddress: e.mintAddress,
    score: {
      total: e.total,
      authenticity: e.authenticity,
      antislop: e.antislop,
      busfactor: e.busfactor,
      momentum: e.momentum,
      community: e.community,
    },
    flags: e.flags,
    realityGap: e.realityGap,
    market: {
      priceUsd: e.priceUsd,
      fdv: e.fdv,
      mcap: e.mcap,
      volume24h: e.volume24h,
      liquidity: e.liquidity,
      holders: e.holders,
    },
    repoStats: {
      stars: e.stars,
      forks: e.forks,
      openIssues: e.openIssues,
      language: e.language,
      ageDays: e.ageDays,
      commits30d: e.commits30d,
      uniqueAuthors30d: e.uniqueAuthors30d,
      lastCommitDaysAgo: e.lastCommitDaysAgo,
    },
    links: {
      assay: `${SITE}/t/${encodeURIComponent(e.symbol)}`,
      github: `https://github.com/${e.repoFullName}`,
    },
  };
}

/** Full transparency shape — everything the score was computed from. */
export function toPublicDetail(e: LeaderboardEntry) {
  return {
    ...toPublicEntry(e),
    commitTimeline12w: e.commitTimeline,
    hourHistogram: e.hourHistogram,
    signals: e.signals,
  };
}
