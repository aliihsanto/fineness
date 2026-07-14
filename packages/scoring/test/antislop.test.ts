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

describe("provenance forensics (v0.2)", () => {
  it("does NOT penalize AI co-author markers on a human-shaped history", () => {
    // AI-assisted development: human rhythm + markers in every message
    const assisted = humanCommits(42).map((c) => ({
      ...c,
      message: `${c.message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`,
    }));
    const plain = antiSlopScore(humanCommits(42), hygieneFull);
    const marked = antiSlopScore(assisted, hygieneFull);
    expect(Number(marked.signals.aiMarkerRatio)).toBe(1);
    expect(Number(marked.signals.slopPenalty)).toBe(0);
    expect(marked.score).toBe(plain.score);
  });

  it("penalizes AI markers when the pattern is machine-made", () => {
    const dumped = slopCommits(7).map((c) => ({
      ...c,
      message: `${c.message}\n\n🤖 Generated with Claude`,
    }));
    const { signals } = antiSlopScore(dumped, hygieneNone);
    expect(Number(signals.aiMarkerRatio)).toBe(1);
    expect(Number(signals.slopPenalty)).toBeGreaterThanOrEqual(0.15);
  });

  it("flags a single-session dump by a small team", () => {
    const { signals } = antiSlopScore(slopCommits(7), hygieneNone);
    expect(signals.singleSession).toBe(true);
    expect(Number(signals.slopPenalty)).toBeGreaterThanOrEqual(0.12);
  });

  it("catches metronome cadence — commits on a fixed clock", () => {
    const base = slopCommits(7, 30).map((c, i) => ({
      ...c,
      // exactly every 10 minutes, spread wide enough to dodge singleSession
      committedAt: new Date(Date.parse("2026-06-20T00:00:00Z") + i * 10 * 60_000),
    }));
    const { signals } = antiSlopScore(base, hygieneNone);
    expect(signals.metronome).toBe(true);
  });
});
