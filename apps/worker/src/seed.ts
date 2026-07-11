import { defaultJobOpts, ingestGithubQueue } from "./queues";

/**
 * Manual seed: `pnpm --filter @fineness/worker seed owner/repo owner2/repo2 ...`
 * or with no args, a starter calibration set.
 */
const CALIBRATION_SET = [
  // known-real
  "vercel/next.js",
  "elizaOS/eliza",
  "sendaifun/solana-agent-kit",
  "goat-sdk/goat",
];

const args = process.argv.slice(2);
const targets = args.length > 0 ? args : CALIBRATION_SET;

for (const full of targets) {
  const [owner, name] = full.split("/");
  if (!owner || !name) {
    console.error(`skipping malformed target: ${full}`);
    continue;
  }
  await ingestGithubQueue.add("scan", { owner, name }, defaultJobOpts);
  console.log(`queued ${owner}/${name}`);
}

process.exit(0);
