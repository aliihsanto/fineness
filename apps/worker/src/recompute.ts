/**
 * Recompute every stored score from raw commits — run after an ALGO_VERSION
 * bump. Commits are kept raw in the DB precisely so this is possible.
 *
 *   pnpm --filter @fineness/worker recompute
 */
import { createDb, schema } from "@fineness/db";
import { computeScore } from "./jobs/compute-score";

const db = createDb();
const repos = await db
  .select({ id: schema.repos.id, owner: schema.repos.owner, name: schema.repos.name })
  .from(schema.repos);

console.log(`[recompute] ${repos.length} repo(s)`);
let done = 0;
for (const r of repos) {
  try {
    const total = await computeScore({ repoId: r.id });
    done++;
    if (done % 50 === 0) console.log(`[recompute] ${done}/${repos.length}`);
    if (total !== null && total < 15) console.log(`  ${r.owner}/${r.name} → ${total}`);
  } catch (err) {
    console.warn(`[recompute] ${r.owner}/${r.name} failed:`, (err as Error).message);
  }
}
console.log(`[recompute] done — ${done}/${repos.length}`);
process.exit(0);
