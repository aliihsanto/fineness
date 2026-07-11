# Deploying fineness (Hetzner CPX22)

CPX22 (2 vCPU / 4 GB / 40 GB) comfortably runs the whole stack:
Postgres (~200 MB), Redis (~30 MB), worker (~150 MB), Next.js web (~250 MB).
The tribe scanner is I/O-bound (RPC calls), not CPU-bound.

## One-time setup

```bash
# on the server
git clone <repo-url> fineness && cd fineness

cat > .env <<'EOF'
POSTGRES_PASSWORD=<strong-password>
GITHUB_TOKENS=ghp_xxx,ghp_yyy          # 2-4 PATs, public_repo scope is enough
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com   # or Helius/QuickNode for scale
NEXT_PUBLIC_SITE_URL=https://fineness.xyz
EOF

docker compose --profile prod up -d --build
docker compose exec worker pnpm --filter @fineness/db migrate
```

## Fill the site before launch

```bash
# 1. entire Tribe launch history (resumable — checkpointed per page, re-run freely)
docker compose exec worker pnpm --filter @fineness/worker tribe-backfill

# 2. optional extra repos / manual token mappings
docker compose exec worker pnpm --filter @fineness/worker seed owner/repo ...
docker compose exec worker pnpm --filter @fineness/worker map-token solana <mint> SYMBOL owner/repo
```

## What runs automatically (worker container)

| Job | Schedule | What it does |
| --- | --- | --- |
| tribe-sweep | every 10 min | new CreateToken launches → token + repo scan + score, cursor-based so bursts are never missed |
| market-sweep | every 30 min | DexScreener quote for every token → market_snapshots |
| github-sweep | every 6 h | re-scan every repo, recompute scores |
| daily-snapshot | 03:00 UTC | repo_snapshots — the moat; history a competitor can never backfill |

Launches without a GitHub link in their metadata land in `submissions` for
manual review instead of being dropped.

## Web

Two options:

- **Hetzner (this compose)**: `web` service on :3000 — put CloudPanel/nginx in
  front as reverse proxy with TLS for the domain.
- **Vercel (plan default)**: deploy `apps/web` to Vercel with `DATABASE_URL`
  pointing at the Hetzner Postgres (expose 5434 only to Vercel IPs or use a
  tunnel). OG cards and ISR run great there; drop the `web` service from prod.

## Scaling notes

- Public mainnet RPC is fine for sweeps (~1 launch/page). The deep backfill
  makes 1 `getTransaction` per program tx — with `TRIBE_THROTTLE_MS=80`
  that's ~12 tx/s; a free Helius key removes the ceiling if history is large.
- GitHub GraphQL: one PAT = 5,000 points/h ≈ ~1,000 repo scans/h. The token
  pool rotates `GITHUB_TOKENS` automatically.
- Backups: `pg_dump` the `fineness` DB daily — snapshots ARE the product.
