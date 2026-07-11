import { describe, expect, it } from "vitest";
import { computeFinenessScore } from "../src/index";
import { authenticityScore } from "../src/authenticity";
import { busFactorScore } from "../src/busfactor";
import { baseMarket, baseRepo, humanCommits, NOW, slopCommits } from "./fixtures/generators";

describe("computeFinenessScore end-to-end", () => {
  it("gives a healthy real project a high score and SHIPPING-adjacent profile", () => {
    const commits = humanCommits(42);
    // make sure there's a very recent commit for freshness
    commits.push({ ...commits[commits.length - 1]!, sha: "fresh1", committedAt: new Date(NOW.getTime() - 3_600_000) });
    const result = computeFinenessScore({
      repo: baseRepo(),
      commits,
      market: baseMarket(),
      now: NOW,
    });
    expect(result.total).toBeGreaterThanOrEqual(70);
    expect(result.flags).not.toContain("AI_SLOP");
    expect(result.flags).not.toContain("FORK");
    expect(result.flags).toContain("SHIPPING");
  });

  it("gives a forked, dumped, abandoned repo a rock-bottom score with the right flags", () => {
    const commits = slopCommits(7);
    const result = computeFinenessScore({
      repo: baseRepo({
        isFork: true,
        parentFullName: "elizaOS/eliza",
        pushedAt: new Date(NOW.getTime() - 41 * 86_400_000),
        stars: 4000,
        forks: 2,
        openIssues: 1,
        watchers: 3,
        hygiene: { hasTests: false, hasCI: false, hasLockfile: false },
      }),
      commits,
      market: baseMarket({ commits7dBeforeLaunch: 40, commits7dAfterLaunch: 2, starVelocity7d: 0 }),
      now: NOW,
    });
    expect(result.total).toBeLessThanOrEqual(20);
    expect(result.flags).toEqual(
      expect.arrayContaining(["FORK", "AI_SLOP", "RUG_WATCH", "DEAD", "SOLO", "FAKE_STARS"]),
    );
    expect(result.realityGap).toBeGreaterThan(100_000);
  });

  it("computes realityGap as FDV / max(total, 1)", () => {
    const result = computeFinenessScore({
      repo: baseRepo(),
      commits: humanCommits(42),
      market: baseMarket({ fdv: 1_000_000 }),
      now: NOW,
    });
    expect(result.realityGap).toBe(Math.round(1_000_000 / Math.max(result.total, 1)));
  });

  it("realityGap is null without market data", () => {
    const result = computeFinenessScore({
      repo: baseRepo(),
      commits: humanCommits(42),
      market: baseMarket({ fdv: null }),
      now: NOW,
    });
    expect(result.realityGap).toBeNull();
  });
});

describe("authenticity", () => {
  it("hard-flags GitHub forks", () => {
    const { score, signals } = authenticityScore(
      baseRepo({ isFork: true, parentFullName: "elizaOS/eliza" }),
      humanCommits(1),
    );
    expect(score).toBeLessThanOrEqual(0 + 0); // 30 - 30
    expect(signals.parent).toBe("elizaOS/eliza");
  });

  it("penalizes hidden forks via fingerprint matches", () => {
    const clean = authenticityScore(baseRepo(), humanCommits(1)).score;
    const hidden = authenticityScore(baseRepo({ fingerprintMatches: 12 }), humanCommits(1)).score;
    expect(clean - hidden).toBe(25);
  });

  it("penalizes identity mismatches by 10 each", () => {
    const clean = authenticityScore(baseRepo(), humanCommits(1)).score;
    const mismatched = authenticityScore(
      baseRepo({
        manifestName: "totally-different-project",
        licenseCopyrightHolder: "Someone Else Inc",
        readmeForeignProjectNames: ["eliza"],
      }),
      humanCommits(1),
    ).score;
    expect(clean - mismatched).toBe(30);
  });

  it("penalizes a 5000+ line first commit", () => {
    const commits = humanCommits(1);
    const dumped = [...commits];
    dumped[0] = { ...dumped[0]!, additions: 20_000 };
    // ensure the modified commit is the earliest
    dumped[0] = { ...dumped[0]!, committedAt: new Date(commits[0]!.committedAt.getTime() - 1000) };
    const clean = authenticityScore(baseRepo(), commits).score;
    const dump = authenticityScore(baseRepo(), dumped).score;
    expect(clean - dump).toBe(15);
  });
});

describe("busFactor", () => {
  it("rewards distributed teams", () => {
    const team = busFactorScore(humanCommits(42), NOW);
    const solo = busFactorScore(slopCommits(7), NOW);
    expect(team.score).toBeGreaterThan(solo.score);
    expect(Number(team.signals.uniqueAuthors)).toBeGreaterThanOrEqual(3);
    expect(Number(solo.signals.uniqueAuthors)).toBe(1);
  });
});
