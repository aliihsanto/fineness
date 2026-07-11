CREATE TABLE "commits" (
	"repo_id" integer NOT NULL,
	"sha" varchar(64) NOT NULL,
	"author_login" varchar(120),
	"author_is_bot" boolean DEFAULT false NOT NULL,
	"committed_at" timestamp with time zone NOT NULL,
	"additions" integer DEFAULT 0 NOT NULL,
	"deletions" integer DEFAULT 0 NOT NULL,
	"message_headline" text,
	CONSTRAINT "commits_repo_id_sha_pk" PRIMARY KEY("repo_id","sha")
);
--> statement-breakpoint
CREATE TABLE "fingerprints" (
	"repo_full_name" varchar(320) NOT NULL,
	"file_path" text NOT NULL,
	"normalized_hash" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"token_id" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"price" real,
	"fdv" real,
	"mcap" real,
	"volume_24h" real,
	"holders" integer,
	"liquidity" real
);
--> statement-breakpoint
CREATE TABLE "repo_snapshots" (
	"repo_id" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"stars" integer NOT NULL,
	"forks" integer NOT NULL,
	"commits_7d" integer NOT NULL,
	"commits_30d" integer NOT NULL,
	"unique_authors_30d" integer NOT NULL,
	"last_push_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "repos" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"github_id" bigint,
	"url" text NOT NULL,
	"created_at_gh" timestamp with time zone,
	"pushed_at" timestamp with time zone,
	"default_branch" varchar(120),
	"license" varchar(60),
	"language" varchar(60),
	"is_fork" boolean DEFAULT false NOT NULL,
	"parent_full_name" varchar(320),
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"watchers" integer DEFAULT 0 NOT NULL,
	"open_issues" integer DEFAULT 0 NOT NULL,
	"has_tests" boolean DEFAULT false NOT NULL,
	"has_ci" boolean DEFAULT false NOT NULL,
	"has_lockfile" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_scanned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_id" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"algo_version" varchar(20) NOT NULL,
	"authenticity" integer NOT NULL,
	"antislop" integer NOT NULL,
	"busfactor" integer NOT NULL,
	"momentum" integer NOT NULL,
	"community" integer NOT NULL,
	"total" integer NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signals" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mint_address" varchar(120) NOT NULL,
	"repo_url" text NOT NULL,
	"submitted_by" varchar(200),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain" varchar(40) NOT NULL,
	"mint_address" varchar(120) NOT NULL,
	"symbol" varchar(40) NOT NULL,
	"name" varchar(200),
	"platform" varchar(40) DEFAULT 'other' NOT NULL,
	"repo_id" integer,
	"launched_at" timestamp with time zone,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_source" text
);
--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo_snapshots" ADD CONSTRAINT "repo_snapshots_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commits_repo_time_idx" ON "commits" USING btree ("repo_id","committed_at");--> statement-breakpoint
CREATE INDEX "fingerprints_hash_idx" ON "fingerprints" USING btree ("normalized_hash");--> statement-breakpoint
CREATE INDEX "market_snapshots_token_ts_idx" ON "market_snapshots" USING btree ("token_id","ts");--> statement-breakpoint
CREATE INDEX "repo_snapshots_repo_ts_idx" ON "repo_snapshots" USING btree ("repo_id","ts");--> statement-breakpoint
CREATE UNIQUE INDEX "repos_owner_name_idx" ON "repos" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "scores_repo_idx" ON "scores" USING btree ("repo_id","computed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tokens_mint_idx" ON "tokens" USING btree ("chain","mint_address");