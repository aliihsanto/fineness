export type Lang = "en";

type Dict = typeof en;

const en = {
  layout: {
    tagline: "ASSAY OFFICE — TOKENIZED REPOS",
    methodology: "METHODOLOGY",
    footer1: "VERIFIABLE GITHUB DATA · NOT FINANCIAL ADVICE",
    footer2: "An observation, not an accusation. Project owners can dispute a mapping via /api/submit.",
  },
  home: {
    eyebrow: "REALITY CHECK — LIVE LEDGER",
    title: "How pure is the repo behind the token?",
    introA:
      "Every token's repository is assayed against verifiable GitHub data — fork detection, AI-slop detection, bus factor, post-launch decay. ",
    gapWord: "Reality gap",
    introB:
      " is dollars of FDV per point of actual building: the bigger the gap, the more the market pays for a repo that isn't there.",
    stats: {
      repos: "REPOS ASSAYED",
      fdv: "FDV TRACKED",
      median: "MEDIAN FINENESS",
      forks: "FORKS",
      slop: "AI SLOP",
      dead: "DEAD 14D+",
      shipping: "SHIPPING",
    },
    demoBadge: "DEMO DATA — AWAITING DATABASE_URL",
    promo: {
      stamp: "HOUSE TOKEN",
      blurb: "The token of this assay office, launched on Tribe — scored by the same rules as everyone else.",
      view: "VIEW ASSAY →",
      trade: "TRADE ON TRIBE ↗",
    },
    sortHint: "click to sort — click again to flip direction",
    tabs: { all: "ALL", tribe: "TRIBE", other: "ESTABLISHED" },
    filters: {
      fdv: "MIN FDV",
      vol: "MIN VOL 24H",
      mcap: "MIN MCAP",
      placeholder: "e.g. 500k",
      hint: "type plain numbers or 500k · 1.5m · 2b",
      grade: "GRADE — SCORE BAND",
      hide: "HIDE FLAGGED",
      shipping: "ONLY SHIPPING (pushed <48h)",
      clear: "CLEAR ALL",
    },
    grades: { base: "BASE METAL", alloyed: "ALLOYED", high: "HIGH PURITY" },
    gapLegend:
      "REALITY GAP = FDV ÷ fineness score — how many dollars of valuation the market pays for each point of verifiable building. Higher = more overpriced. Click any column header to sort.",
    noMatch: "No tokens match these filters.",
    platform: "PLATFORM",
    filtersTitle: "FILTERS",
    prev: "← PREV",
    next: "NEXT →",
    showing: (a: number, b: number, n: number) => `SHOWING ${a}–${b} OF ${n}`,
    th: {
      token: "TOKEN",
      fineness: "FINENESS",
      fdv: "FDV",
      vol: "VOL 24H",
      gap: "REALITY GAP",
      stars: "STARS",
      devs: "DEVS 30D",
      flags: "FLAGS",
      weeks: "12 WEEKS",
    },
    liq: "LIQ",
    holders: "HOLDERS",
    lastPush: (d: number) => `LAST PUSH ${d}D`,
    pushedToday: "PUSHED TODAY",
    forks: "FORKS",
    commits: "COMMITS",
    repoAge: "REPO AGE",
  },
  token: {
    assayReport: "ASSAY REPORT — TOKENIZED REPOSITORY",
    demoRepo: "DEMO — FICTIONAL REPO",
    launched: (d: number) => `launched ${d}d ago`,
    fdv: "FDV",
    gap: "REALITY GAP",
    lastCommit: "LAST COMMIT",
    today: "TODAY",
    daysAgo: (d: number) => `${d}D AGO`,
    share: "SHARE ON X",
    verdict: (total: number, grade: string, defects: number, gap: string | null) =>
      `${total}/100 — ${grade}. ${defects} defect stamp${defects === 1 ? "" : "s"}.` +
      (gap ? ` The market pays ${gap} per point of verifiable building.` : ""),
    sections: {
      market: "MARKET",
      repository: "REPOSITORY",
      notes: "ASSAY NOTES",
      subscores: "SUB-SCORES",
      hours: "COMMIT HOURS — 24H UTC",
      activity: "COMMIT ACTIVITY — WEEKLY",
      signals: "RAW SIGNALS",
    },
    hoursCaption:
      "Humans sleep: a real team leaves a 4+ hour gap in this histogram. A flat pattern means machine pushing.",
    signalsHint: "EVERY SCORE IS REPRODUCIBLE FROM THESE INPUTS — CHECK OUR MATH.",
    market: {
      price: "PRICE",
      fdv: "FDV",
      mcap: "MARKET CAP",
      vol: "VOLUME 24H",
      liq: "LIQUIDITY",
      holders: "HOLDERS",
    },
    repo: {
      stars: "STARS",
      forks: "FORKS",
      watchers: "WATCHERS",
      issues: "OPEN ISSUES",
      language: "LANGUAGE",
      license: "LICENSE",
      none: "NONE",
      age: "REPO AGE",
      commits30: "COMMITS 30D",
      devs30: "DEVS 30D",
      decay: "LAUNCH DECAY",
    },
    subs: [
      { key: "authenticity", name: "AUTHENTICITY", desc: "is this actually their code?" },
      { key: "antislop", name: "ANTI-SLOP", desc: "human development vs AI dump" },
      { key: "busfactor", name: "BUS FACTOR", desc: "survives one person leaving?" },
      { key: "momentum", name: "MOMENTUM", desc: "still alive after launch?" },
      { key: "community", name: "COMMUNITY", desc: "organic interest vs bought stars" },
    ],
  },
  notes: {
    fork: (p: string) => `Repository is a fork of ${p}.`,
    hiddenFork: "File hashes match a known popular codebase — hidden fork.",
    firstDump: (n: string) => `First commit dumped ${n} lines in one shot.`,
    medianHigh: (n: string) => `Median commit adds ${n} lines — human range is 30-250.`,
    medianOk: (n: number) => `Median commit adds ${n} lines — consistent with hand-written iteration.`,
    burst: (p: number) => `${p}% of commits landed under 3 minutes apart — machine-gun pushing.`,
    noSleep: "No sleep gap in the 24h commit histogram — nobody pushed this by hand around the clock.",
    sleep: "Commit histogram shows a clear overnight gap — a human sleep cycle.",
    decayBad: (p: number) => `Commit rate collapsed to ${p}% of pre-launch pace within a week of launch.`,
    decayGood: "Commit rate held or accelerated after launch.",
    fakeStars: (stars: string, forks: number, issues: number, ratio: number) =>
      `${stars} stars against ${forks} forks and ${issues} open issues — anomaly ratio ${ratio}. Organic repos don't look like this.`,
    stale: (d: number) => `No push for ${d} days.`,
    solo: "Effectively a single author in the last 30 days — bus factor of one.",
    team: (n: number) => `${n} distinct contributors active in the last 30 days.`,
    shipping: "Commit landed within the last 48 hours — still shipping.",
  },
  methodology: {
    eyebrow: "METHODOLOGY",
    title: "How the fineness score works",
    intro:
      "Fineness is the millesimal purity of gold — 999 is pure, 400 is mostly filler. We apply the same idea to repos behind tokens. Every score is 0-100, built from five verifiable sub-scores. No price prediction, no buy/sell signals — only GitHub data anyone can check.",
    sections: [
      {
        title: "AUTHENTICITY — 30 PTS",
        body: "Is this actually their code? GitHub fork flag (−30), hidden forks caught by file-hash fingerprinting against a corpus of popular repos (−25), identity mismatches between package.json / LICENSE / README and the repo owner (−10 each), 5,000+ line first-commit dumps (−15), erased git history (−10).",
      },
      {
        title: "ANTI-SLOP — 25 PTS",
        body: "Did humans build this over time, or did an AI dump it overnight? Commit size distribution (human median is ~30-250 added lines), machine-gun commit bursts (<3 min apart), commit message entropy (templated messages collapse to one bucket), circadian rhythm (humans sleep; a 24h histogram with no 4-hour gap is suspicious), and engineering hygiene (tests, CI, lockfile).",
      },
      {
        title: "BUS FACTOR — 15 PTS",
        body: "15 × (1 − Gini) × min(uniqueAuthors/4, 1) over the last 90 days of non-bot commits. One person doing 95% of commits scores near zero.",
      },
      {
        title: "MOMENTUM — 20 PTS",
        body: "Recency decays exponentially: exp(−daysSinceLastPush / 10). Post-launch decay ratio compares commits 7 days after launch vs 7 days before — below 0.2 raises the RUG WATCH flag.",
      },
      {
        title: "COMMUNITY — 10 PTS",
        body: "Star velocity plus an engagement mix. High stars with near-zero forks, issues and watchers is not organic — that raises FAKE STARS and halves the sub-score.",
      },
    ],
    gapTitle: "REALITY GAP",
    gapBody:
      "— dollars of fully diluted valuation per point of verifiable building. The leaderboard sorts by it.",
    transparencyTitle: "TRANSPARENCY",
    transparencyBody:
      "Every score page shows the raw signals it was computed from, and the scoring engine is open source (@fineness/scoring) — run it yourself. Scores carry an algo_version; when the formula changes, everything is recomputed. If we got your repo wrong, dispute the mapping via the submit endpoint.",
  },
};


export function t(_lang?: Lang): Dict {
  return en;
}
