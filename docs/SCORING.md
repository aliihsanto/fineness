# Fineness Score — Methodology

> Fineness is the millesimal purity of gold: 999 is pure, 400 is mostly filler.
> We apply the same idea to the repos behind tokens.

One 0-100 score, five sub-scores, binary flags. We show verifiable GitHub data —
no price predictions, no buy/sell signals, no investment advice.

## Sub-scores

### 1. Authenticity (30 pts) — is this actually their code?

| Signal | How | Impact |
| --- | --- | --- |
| GitHub fork flag | `repository.isFork`, `parent.nameWithOwner` | −30 (hard flag) |
| Hidden fork | file-hash comparison vs corpus of popular repos (top source files, normalized) | −25 |
| Identity mismatch | `package.json.name` ≠ repo name; LICENSE copyright ≠ owner; foreign project names in README | −10 each |
| First-commit dump | 5,000+ added lines in the first commit | −15 |
| Erased history | `git init` + single-shot history, or history starting long after repo creation | −10 |

### 2. Anti-Slop (25 pts) — humans over time, or an AI dump overnight?

Weighted signals (sum = 1.0, scaled to 25):

- **0.30** — commit-size median (human median ≈ 30-250 added lines; >800 scores 0)
- **0.10** — commit-size p95 (>6,000 scores 0)
- **0.20** — burst ratio: share of commit gaps < 3 minutes
- **0.20** — message entropy + prefix diversity (templated "feat: add X" collapses)
- **0.10** — circadian rhythm: a ≥4h empty block in the 24h commit histogram (humans sleep)
- **0.10** — engineering hygiene: tests, CI, lockfile

**Calibration contract** (enforced by tests in `packages/scoring/test`):
known-real development profiles score **18-25**, known slop scores **0-8**.

### 3. Bus Factor (15 pts)

`15 × (1 − gini) × min(uniqueAuthors / 4, 1)` over non-bot commits from the last 90 days.

### 4. Momentum (20 pts)

- Recency: `exp(−daysSinceLastPush / 10)` (10 pts)
- 30-day human commit volume, saturating at 30 commits (5 pts)
- Post-launch decay: `commits_7d_after_launch / commits_7d_before_launch` (5 pts)
  — `< 0.2` raises 💀 RUG WATCH

### 5. Community (10 pts)

- Star velocity (7d) or log-scale stars fallback (6 pts)
- Engagement mix: (forks + issues + watchers) / stars (4 pts)
- `stars / (forks + issues + 1) > 80` with 200+ stars ⇒ ⭐ FAKE STARS, sub-score halved

## Flags

| Badge | Condition |
| --- | --- |
| 🚩 FORK | `isFork` or ≥5 fingerprint hash matches |
| 🤖 AI SLOP | anti-slop < 8/25 |
| 💀 RUG WATCH | post-launch decay ratio < 0.2 |
| 🪦 DEAD | no push for 14+ days |
| 👤 SOLO | one unique author in 90 days |
| ⭐ FAKE STARS | star anomaly (above) |
| ✅ SHIPPING | commit in last 48h + 3+ contributors |

## Reality Gap

`realityGap = FDV / max(finenessScore, 1)` — dollars of fully-diluted valuation per point
of verifiable building. Default leaderboard sort.

## Transparency

- Raw signals for every score are stored (`scores.signals`) and shown on each page.
- `scores.algo_version` versions the formula; changes trigger recomputation of history.
- The engine is a pure-function package: `packages/scoring`. Run it yourself.
- Wrong mapping or a score you dispute? Open an issue or use `/api/submit`.

*An observation, not an accusation. "Fineness 11 · last commit 41 days ago" is data.
Nothing here is investment advice.*
