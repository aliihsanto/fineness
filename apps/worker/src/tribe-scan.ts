/**
 * Manual Tribe sweep:
 *   DATABASE_URL=... GITHUB_TOKENS=... pnpm --filter @fineness/worker tribe-scan [limit]
 */
import { ingestTribe } from "./jobs/ingest-tribe";

const limit = Number(process.argv[2] ?? 25);
await ingestTribe({ limit });
process.exit(0);
