/**
 * DB-free calibration run against real GitHub repos.
 *
 *   GITHUB_TOKENS=ghp_xxx pnpm --filter @fineness/worker calibrate owner/repo owner2/repo2 ...
 *
 * Scans each repo live (one GraphQL request each), runs the real scoring
 * engine, and prints the full breakdown. This is how weights get tuned:
 * known-real repos must land high, known slop must land low.
 */
import { GithubClient } from "@fineness/github";
import {
  computeFinenessScore,
  hourHistogram,
  weeklyTimeline,
  type Commit,
  type ScoreResult,
} from "@fineness/scoring";

const DEFAULT_SET = [
  "elizaOS/eliza",
  "sendaifun/solana-agent-kit",
  "goat-sdk/goat",
  "vercel/next.js",
];

const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_SET;
const gh = GithubClient.fromEnv();
const now = new Date();

type Report = {
  repo: string;
  result: ScoreResult;
  commits: number;
  sleepGap: boolean | string | number | null;
  hourHist: number[];
  weekly: number[];
};

const reports: Report[] = [];

for (const full of targets) {
  const [owner, name] = full.split("/");
  if (!owner || !name) {
    console.error(`skipping malformed target: ${full}`);
    continue;
  }
  process.stdout.write(`scanning ${full} ... `);
  const scan = await gh.scanRepo(owner, name);
  if (!scan) {
    console.log("NOT FOUND");
    continue;
  }

  const commits: Commit[] = scan.commits.map((c) => ({
    sha: c.oid,
    authorLogin: c.author?.user?.login ?? null,
    committedAt: new Date(c.committedDate),
    additions: c.additions,
    deletions: c.deletions,
    message: c.messageHeadline,
  }));

  const result = computeFinenessScore({
    repo: {
      owner,
      name,
      createdAt: new Date(scan.createdAt),
      pushedAt: new Date(scan.pushedAt),
      isFork: scan.isFork,
      parentFullName: scan.parentFullName,
      stars: scan.stars,
      forks: scan.forks,
      watchers: scan.watchers,
      openIssues: scan.openIssues,
      manifestName: null,
      licenseCopyrightHolder: null,
      readmeForeignProjectNames: [],
      fingerprintMatches: 0,
      hygiene: { hasTests: scan.hasTests, hasCI: scan.hasCI, hasLockfile: scan.hasLockfile },
      historyComplete: scan.commits.length < 100,
    },
    commits,
    market: {
      fdv: null,
      launchedAt: null,
      commits7dBeforeLaunch: null,
      commits7dAfterLaunch: null,
      starVelocity7d: null,
    },
    now,
  });

  console.log(`ok (${commits.length} commits)`);
  reports.push({
    repo: full,
    result,
    commits: commits.length,
    sleepGap: result.antislop.signals.sleepGap ?? null,
    hourHist: hourHistogram(commits),
    weekly: weeklyTimeline(commits, 12, now),
  });
}

console.log("");
console.log(
  pad("REPO", 32),
  pad("TOTAL", 7),
  pad("AUTH", 6),
  pad("SLOP", 6),
  pad("BUS", 5),
  pad("MOM", 5),
  pad("COM", 5),
  "FLAGS",
);
for (const r of reports) {
  console.log(
    pad(r.repo, 32),
    pad(`${r.result.total}/100`, 7),
    pad(`${r.result.authenticity.score}/30`, 6),
    pad(`${r.result.antislop.score}/25`, 6),
    pad(`${r.result.busFactor.score}/15`, 5),
    pad(`${r.result.momentum.score}/20`, 5),
    pad(`${r.result.community.score}/10`, 5),
    r.result.flags.join(",") || "-",
  );
}

console.log("\n— details —");
for (const r of reports) {
  console.log(`\n${r.repo}`);
  console.log("  antislop:", JSON.stringify(r.result.antislop.signals));
  console.log("  busfactor:", JSON.stringify(r.result.busFactor.signals));
  console.log("  momentum:", JSON.stringify(r.result.momentum.signals));
  console.log("  community:", JSON.stringify(r.result.community.signals));
  console.log("  hours:", r.hourHist.join(","));
  console.log("  weekly:", r.weekly.join(","));
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}
