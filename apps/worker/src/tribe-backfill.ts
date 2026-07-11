/**
 * Deep-scan the ENTIRE Tribe program history and ingest every launch:
 *
 *   DATABASE_URL=... GITHUB_TOKENS=... pnpm --filter @fineness/worker tribe-backfill
 *
 * Walks signatures oldest-ward page by page; the position is checkpointed in
 * scan_cursors after every page, so a rate-limit kill or Ctrl+C resumes where
 * it left off. Safe to re-run any time — processing is idempotent by mint.
 */
import { createDb } from "@fineness/db";
import { SolanaRpc, iterateSignatures, parseCreateTokenTx } from "@fineness/tribe";
import { getCursor, processLaunch, setCursor } from "./jobs/ingest-tribe";

const BACKFILL_CURSOR = "tribe:backfill-before";
const THROTTLE_MS = Number(process.env.TRIBE_THROTTLE_MS ?? 80);

const db = createDb();
const rpc = new SolanaRpc();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const resumeBefore = await getCursor(db, BACKFILL_CURSOR);
if (resumeBefore) console.log(`[backfill] resuming before ${resumeBefore.slice(0, 20)}...`);

let scanned = 0;
let creates = 0;
let created = 0;
const startedAt = Date.now();

for await (const page of iterateSignatures(rpc, { before: resumeBefore ?? undefined, pageSize: 1000 })) {
  for (const sig of page) {
    if (sig.err) continue;
    const launch = await parseCreateTokenTx(rpc, sig.signature);
    if (launch) {
      creates++;
      if (await processLaunch(db, rpc, launch)) created++;
    }
    scanned++;
    await sleep(THROTTLE_MS);
  }
  await setCursor(db, BACKFILL_CURSOR, page[page.length - 1]!.signature);
  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`[backfill] ${scanned} tx scanned · ${creates} launches · ${created} new tokens · ${mins}min`);
}

console.log(`[backfill] COMPLETE — ${scanned} tx, ${creates} launches, ${created} new tokens`);
process.exit(0);
