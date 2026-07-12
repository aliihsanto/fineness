import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : undefined,
  maxRetriesPerRequest: null,
};

export const QUEUE_NAMES = {
  ingestGithub: "ingest-github",
  ingestMarket: "ingest-market",
  ingestTribe: "ingest-tribe",
  discover: "discover",
  computeScore: "compute-score",
  snapshot: "snapshot",
} as const;

export const ingestGithubQueue = new Queue(QUEUE_NAMES.ingestGithub, { connection });
export const ingestMarketQueue = new Queue(QUEUE_NAMES.ingestMarket, { connection });
export const ingestTribeQueue = new Queue(QUEUE_NAMES.ingestTribe, { connection });
export const discoverQueue = new Queue(QUEUE_NAMES.discover, { connection });
export const computeScoreQueue = new Queue(QUEUE_NAMES.computeScore, { connection });
export const snapshotQueue = new Queue(QUEUE_NAMES.snapshot, { connection });

export const defaultJobOpts = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 30_000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};
