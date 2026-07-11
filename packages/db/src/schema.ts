import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const repos = pgTable(
  "repos",
  {
    id: serial("id").primaryKey(),
    owner: varchar("owner", { length: 120 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    githubId: bigint("github_id", { mode: "number" }),
    url: text("url").notNull(),
    createdAtGh: timestamp("created_at_gh", { withTimezone: true }),
    pushedAt: timestamp("pushed_at", { withTimezone: true }),
    defaultBranch: varchar("default_branch", { length: 120 }),
    license: varchar("license", { length: 60 }),
    language: varchar("language", { length: 60 }),
    isFork: boolean("is_fork").default(false).notNull(),
    parentFullName: varchar("parent_full_name", { length: 320 }),
    stars: integer("stars").default(0).notNull(),
    forks: integer("forks").default(0).notNull(),
    watchers: integer("watchers").default(0).notNull(),
    openIssues: integer("open_issues").default(0).notNull(),
    hasTests: boolean("has_tests").default(false).notNull(),
    hasCi: boolean("has_ci").default(false).notNull(),
    hasLockfile: boolean("has_lockfile").default(false).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("repos_owner_name_idx").on(t.owner, t.name)],
);

// raw commits are kept so scores can be recomputed when the formula changes
export const commits = pgTable(
  "commits",
  {
    repoId: integer("repo_id")
      .references(() => repos.id)
      .notNull(),
    sha: varchar("sha", { length: 64 }).notNull(),
    authorLogin: varchar("author_login", { length: 120 }),
    authorIsBot: boolean("author_is_bot").default(false).notNull(),
    committedAt: timestamp("committed_at", { withTimezone: true }).notNull(),
    additions: integer("additions").default(0).notNull(),
    deletions: integer("deletions").default(0).notNull(),
    messageHeadline: text("message_headline"),
  },
  (t) => [primaryKey({ columns: [t.repoId, t.sha] }), index("commits_repo_time_idx").on(t.repoId, t.committedAt)],
);

export const tokens = pgTable(
  "tokens",
  {
    id: serial("id").primaryKey(),
    chain: varchar("chain", { length: 40 }).notNull(),
    mintAddress: varchar("mint_address", { length: 120 }).notNull(),
    symbol: varchar("symbol", { length: 40 }).notNull(),
    name: varchar("name", { length: 200 }),
    platform: varchar("platform", { length: 40 }).default("other").notNull(), // 'tribe' | 'pumpfun' | 'other'
    repoId: integer("repo_id").references(() => repos.id),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    verified: boolean("verified").default(false).notNull(),
    verificationSource: text("verification_source"),
  },
  (t) => [uniqueIndex("tokens_mint_idx").on(t.chain, t.mintAddress)],
);

export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    tokenId: integer("token_id")
      .references(() => tokens.id)
      .notNull(),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    price: real("price"),
    fdv: real("fdv"),
    mcap: real("mcap"),
    volume24h: real("volume_24h"),
    holders: integer("holders"),
    liquidity: real("liquidity"),
  },
  (t) => [index("market_snapshots_token_ts_idx").on(t.tokenId, t.ts)],
);

// ← MOAT: daily repo snapshots; GitHub won't give you this history later
export const repoSnapshots = pgTable(
  "repo_snapshots",
  {
    repoId: integer("repo_id")
      .references(() => repos.id)
      .notNull(),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    stars: integer("stars").notNull(),
    forks: integer("forks").notNull(),
    commits7d: integer("commits_7d").notNull(),
    commits30d: integer("commits_30d").notNull(),
    uniqueAuthors30d: integer("unique_authors_30d").notNull(),
    lastPushAt: timestamp("last_push_at", { withTimezone: true }),
  },
  (t) => [index("repo_snapshots_repo_ts_idx").on(t.repoId, t.ts)],
);

export const scores = pgTable(
  "scores",
  {
    id: serial("id").primaryKey(),
    repoId: integer("repo_id")
      .references(() => repos.id)
      .notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
    algoVersion: varchar("algo_version", { length: 20 }).notNull(),
    authenticity: integer("authenticity").notNull(),
    antislop: integer("antislop").notNull(),
    busfactor: integer("busfactor").notNull(),
    momentum: integer("momentum").notNull(),
    community: integer("community").notNull(),
    total: integer("total").notNull(),
    flags: jsonb("flags").$type<string[]>().default([]).notNull(),
    signals: jsonb("signals").$type<Record<string, unknown>>().default({}).notNull(), // raw inputs for transparency
  },
  (t) => [index("scores_repo_idx").on(t.repoId, t.computedAt)],
);

// hidden-fork detection corpus
export const fingerprints = pgTable(
  "fingerprints",
  {
    repoFullName: varchar("repo_full_name", { length: 320 }).notNull(),
    filePath: text("file_path").notNull(),
    normalizedHash: varchar("normalized_hash", { length: 64 }).notNull(),
  },
  (t) => [index("fingerprints_hash_idx").on(t.normalizedHash)],
);

// resumable scan positions (e.g. tribe sweep/backfill signatures)
export const scanCursors = pgTable("scan_cursors", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// community token↔repo mapping submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  mintAddress: varchar("mint_address", { length: 120 }).notNull(),
  repoUrl: text("repo_url").notNull(),
  submittedBy: varchar("submitted_by", { length: 200 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | approved | rejected
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
