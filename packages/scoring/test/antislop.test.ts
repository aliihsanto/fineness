import { describe, expect, it } from "vitest";
import { antiSlopScore } from "../src/antislop";
import { humanCommits, slopCommits } from "./fixtures/generators";

const hygieneFull = { hasTests: true, hasCI: true, hasLockfile: true };
const hygieneNone = { hasTests: false, hasCI: false, hasLockfile: false };

describe("antiSlopScore calibration", () => {
  it("scores known-real development in the 18-25 band", () => {
    for (const seed of [1, 42, 99, 1234]) {
      const { score, signals } = antiSlopScore(humanCommits(seed), hygieneFull);
      expect(score, JSON.stringify(signals)).toBeGreaterThanOrEqual(18);
      expect(score).toBeLessThanOrEqual(25);
    }
  });

  it("scores known slop in the 0-8 band", () => {
    for (const seed of [1, 7, 55, 4321]) {
      const { score, signals } = antiSlopScore(slopCommits(seed), hygieneNone);
      expect(score, JSON.stringify(signals)).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(8);
    }
  });

  it("returns 0 with too few human commits", () => {
    const { score, signals } = antiSlopScore(humanCommits(1, 3), hygieneFull);
    expect(score).toBe(0);
    expect(signals.tooFewCommits).toBe(3);
  });

  it("ignores bot commits", () => {
    const commits = [
      ...humanCommits(42),
      ...slopCommits(7).map((c) => ({ ...c, authorLogin: "dependabot[bot]" })),
    ];
    const withBots = antiSlopScore(commits, hygieneFull);
    const withoutBots = antiSlopScore(humanCommits(42), hygieneFull);
    expect(withBots.score).toBe(withoutBots.score);
  });
});
