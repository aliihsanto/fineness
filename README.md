<p align="center">
  <a href="https://fineness.xyz"><img src="apps/web/assets/logo.png" width="90" alt="fineness"></a>
</p>

<h1 align="center">fineness</h1>

<p align="center">
  <a href="https://fineness.xyz">fineness.xyz</a> ·
  <a href="https://fineness.xyz/docs">API</a> ·
  <a href="https://fineness.xyz/methodology">methodology</a> ·
  <a href="https://tribe.run/token/8eUAUP9R8uqJ2MiUoDF6xF2AxNAXmfp4G1DSe4Mki4f4">$FINENESS on Tribe</a>
</p>

<p align="center">
  <a href="https://fineness.xyz/t/FINENESS"><img src="https://fineness.xyz/api/badge/FINENESS" alt="fineness score"></a>
</p>

<p align="center"><i>Yes, we score ourselves with the same rules. No, we don't get to cheat.</i></p>

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

## Public API

No auth, no key, CORS open — docs at [fineness.xyz/docs](https://fineness.xyz/docs).

```
GET  /api                      endpoint index
GET  /api/stats                ledger-wide aggregates
GET  /api/leaderboard          ?platform=tribe|other &sort=gap|fineness|fdv|volume &flag=FORK &limit=100
GET  /api/token/{symbol}       full assay report incl. raw scoring signals
GET  /api/score/{owner}/{repo} same report, looked up by GitHub repo
POST /api/submit               submit or dispute a token↔repo mapping
```

## Disclaimers

Data shown is an observation, not an accusation, and is **not investment advice**.
Project owners can dispute or correct a token↔repo mapping via `/api/submit` or by
opening an issue.

MIT

<!-- hypertribe:sponsors:start -->
## Sponsors

[![fineness Sponsors](https://api.tribe.run/tokens/8eUAUP9R8uqJ2MiUoDF6xF2AxNAXmfp4G1DSe4Mki4f4/sponsors.svg)](https://tribe.run/token/8eUAUP9R8uqJ2MiUoDF6xF2AxNAXmfp4G1DSe4Mki4f4)

Become a sponsor on [Tribe.run](https://tribe.run/token/8eUAUP9R8uqJ2MiUoDF6xF2AxNAXmfp4G1DSe4Mki4f4).
<!-- hypertribe:sponsors:end -->
