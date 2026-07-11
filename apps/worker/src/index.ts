import { Worker } from "bullmq";
import {
  computeScoreQueue,
  connection,
  defaultJobOpts,
  ingestGithubQueue,
  ingestMarketQueue,
  ingestTribeQueue,
  QUEUE_NAMES,
  snapshotQueue,
} from "./queues";
import { ingestGithub } from "./jobs/ingest-github";
import { ingestMarket } from "./jobs/ingest-market";
import { ingestTribe } from "./jobs/ingest-tribe";
import { computeScore } from "./jobs/compute-score";
import { snapshotAll } from "./jobs/snapshot";

import { createDb, schema } from "@fineness/db";

const workers = [
  new Worker(
    QUEUE_NAMES.ingestGithub,
    async (job) => {
      if (job.name === "sweep") {
        // fan out: re-scan every known repo
        const db = createDb();
        const repos = await db.select({ owner: schema.repos.owner, name: schema.repos.name }).from(schema.repos);
        for (const r of repos) {
          await ingestGithubQueue.add("scan", { owner: r.owner, name: r.name }, defaultJobOpts);
        }
        return;
      }
      const repoId = await ingestGithub(job.data);
      if (repoId) {
        await computeScoreQueue.add("compute", { repoId }, defaultJobOpts);
      }
    },
    { connection, concurrency: 4 },
  ),
  new Worker(
    QUEUE_NAMES.ingestMarket,
    async (job) => {
      if (job.name === "sweep") {
        const db = createDb();
        const tokens = await db.select({ id: schema.tokens.id }).from(schema.tokens);
        for (const t of tokens) {
          await ingestMarketQueue.add("quote", { tokenId: t.id }, defaultJobOpts);
        }
        return;
      }
      return ingestMarket(job.data);
    },
    { connection, concurrency: 4 },
  ),
  new Worker(QUEUE_NAMES.computeScore, async (job) => computeScore(job.data), {
    connection,
    concurrency: 8,
  }),
  new Worker(QUEUE_NAMES.snapshot, async () => snapshotAll(), { connection, concurrency: 1 }),
  new Worker(QUEUE_NAMES.ingestTribe, async () => ingestTribe({ limit: 25 }), {
    connection,
    concurrency: 1,
  }),
];

for (const w of workers) {
  w.on("failed", (job, err) => console.error(`[${w.name}] job ${job?.id} failed:`, err.message));
  w.on("completed", (job) => console.log(`[${w.name}] job ${job.id} done`));
}

// ── Repeatable schedules ─────────────────────────────────────────────────────
// snapshot: daily at 03:00 UTC — runs from day 1, the moat accretes even
// before the rest of the product exists.
await snapshotQueue.upsertJobScheduler("daily-snapshot", { pattern: "0 3 * * *" }, { name: "snapshot" });

// market: every 30 minutes for all tokens (fan-out happens in the job below)
await ingestMarketQueue.upsertJobScheduler("market-sweep", { pattern: "*/30 * * * *" }, { name: "sweep" });

// github rescan: active repos every 6h, handled by a sweep job
await ingestGithubQueue.upsertJobScheduler("github-sweep", { pattern: "0 */6 * * *" }, { name: "sweep" });

// tribe launchpad: sweep on-chain CreateToken launches every 10 minutes
await ingestTribeQueue.upsertJobScheduler("tribe-sweep", { pattern: "*/10 * * * *" }, { name: "sweep" });

console.log("[worker] fineness worker up — queues:", Object.values(QUEUE_NAMES).join(", "));
