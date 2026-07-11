# fineness

**GitHub reality check for tokenized repos.** Scan the repo behind any token — get a
verifiable **fineness score** (0-100), like gold purity for code:

> `$AGENTX · FDV $2.1M · fineness 11/100 · 🚩FORK 💀RUG WATCH`
> Last commit: 41 days ago. Repo is a fork of elizaOS/eliza.

No price predictions. No buy/sell signals. Only GitHub data anyone can verify.
Methodology: [docs/SCORING.md](docs/SCORING.md).

## How it works

- **Authenticity (30)** — fork flags, hidden-fork fingerprinting, identity mismatches, first-commit dumps
- **Anti-Slop (25)** — commit-size distribution, burst detection, message entropy, circadian rhythm
- **Bus Factor (15)** — contributor Gini + unique authors (90d)
- **Momentum (20)** — recency decay + post-launch rug detection
- **Community (10)** — star velocity + fake-star anomaly
- **Reality Gap** — `FDV / max(score, 1)`: dollars of valuation per point of actual building

## Stack

pnpm monorepo · Next.js 15 (Vercel) · Node worker with BullMQ + Redis (Hetzner) ·
Postgres 16 + Drizzle · GitHub GraphQL v4 with PAT pool · DexScreener.

```
apps/web        Next.js: leaderboard, token pages, dynamic OG cards, /api/stats
apps/worker     BullMQ jobs: ingest-github, ingest-market, compute-score, daily snapshot (the moat)
packages/scoring  pure scoring functions — the IP, 100% deterministic, calibration-tested
packages/db     Drizzle schema + migrations
packages/github GraphQL client + token pool + rate-limit backoff
packages/market DexScreener adapter
```

## Quickstart

```bash
pnpm install
docker compose up -d postgres redis
cp .env.example .env          # add your GITHUB_TOKENS
pnpm db:generate && pnpm db:migrate
pnpm dev                      # web on :3000 (demo data until DB has scans)
pnpm dev:worker               # start queues + crons
pnpm --filter @fineness/worker seed owner/repo ...   # queue repos to scan
```

Run the scoring calibration suite:

```bash
pnpm --filter @fineness/scoring test
```

## Disclaimers

Data shown is an observation, not an accusation, and is **not investment advice**.
Project owners can dispute or correct a token↔repo mapping via `/api/submit` or by
opening an issue.

MIT
