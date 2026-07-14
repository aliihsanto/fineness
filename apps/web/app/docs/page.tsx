export const metadata = { title: "API — fineness" };

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/leaderboard",
    desc: "The full assay ledger — every scored token with market data and reality gap.",
    params: [
      ["platform", "tribe | other — filter by launchpad"],
      ["sort", "gap | fineness | fdv | volume (default gap; fineness sorts worst-first)"],
      ["flag", "FORK | AI_SLOP | RUG_WATCH | DEAD | SOLO | FAKE_STARS | SHIPPING"],
      ["limit", "1–500, default 100"],
    ],
    example: "curl https://fineness.xyz/api/leaderboard?platform=tribe&sort=fineness&limit=10",
  },
  {
    method: "GET",
    path: "/api/token/{symbol}",
    desc: "Full assay report for one token — sub-scores, flags, market snapshot, and the raw signals the score was computed from. Every score is reproducible from these inputs.",
    params: [],
    example: "curl https://fineness.xyz/api/token/FINENESS",
  },
  {
    method: "GET",
    path: "/api/score/{owner}/{repo}",
    desc: "Same assay report, looked up by GitHub repository instead of token symbol.",
    params: [],
    example: "curl https://fineness.xyz/api/score/aliihsanto/fineness",
  },
  {
    method: "GET",
    path: "/api/badge/{symbol}",
    desc: "SVG score badge for your README — color follows the grade. Wear your fineness; every embed links back to the assay.",
    params: [],
    example: "[![fineness](https://fineness.xyz/api/badge/FINENESS)](https://fineness.xyz/t/FINENESS)",
  },
  {
    method: "GET",
    path: "/api/stats",
    desc: "Ledger-wide aggregates: repos assayed, total FDV tracked, median fineness, flag rates. Built for bots and dashboards.",
    params: [],
    example: "curl https://fineness.xyz/api/stats",
  },
  {
    method: "POST",
    path: "/api/submit",
    desc: "Submit a token↔repo mapping we're missing, or dispute one we got wrong.",
    params: [["body", `{ "tokenAddress": "...", "chain": "solana", "repoUrl": "https://github.com/..." }`]],
    example: `curl -X POST https://fineness.xyz/api/submit -H 'content-type: application/json' -d '{"tokenAddress":"...","chain":"solana","repoUrl":"https://github.com/owner/repo"}'`,
  },
];

export default function Docs() {
  return (
    <article className="max-w-3xl">
      <div className="font-mono text-[11px] tracking-[0.35em] text-gold">PUBLIC API</div>
      <h1 className="mt-3 font-display text-4xl leading-tight text-bone sm:text-5xl">
        The ledger, machine-readable
      </h1>
      <p className="mt-5 leading-relaxed text-sage">
        Everything on this site is served as JSON too. No auth, no key, CORS open — build bots,
        dashboards and trading filters on top of it. Scores carry an{" "}
        <code className="bg-panel px-1.5 py-0.5 font-mono text-sm text-gold">algo_version</code> and every
        report includes the raw signals it was computed from, so you can check our math.
      </p>

      <div className="mt-10 space-y-8">
        {ENDPOINTS.map((e) => (
          <section key={e.path} className="border-l-2 pl-5" style={{ borderColor: "rgba(217,180,84,0.35)" }}>
            <h2 className="flex flex-wrap items-baseline gap-3 font-mono text-sm">
              <span className={e.method === "GET" ? "text-jade" : "text-brass"}>{e.method}</span>
              <span className="font-semibold text-bone">{e.path}</span>
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-sage">{e.desc}</p>
            {e.params.length > 0 && (
              <dl className="mt-3 space-y-1">
                {e.params.map(([name, desc]) => (
                  <div key={name} className="flex gap-3 font-mono text-[12px] leading-relaxed">
                    <dt className="shrink-0 text-gold">{name}</dt>
                    <dd className="text-faint">{desc}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-3 overflow-x-auto border hairline bg-panel px-3 py-2">
              <code className="whitespace-pre font-mono text-[12px] text-sage">{e.example}</code>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold tracking-[0.25em] text-gold">FAIR USE</h2>
        <p className="mt-2 leading-relaxed text-sage">
          Data refreshes on the worker's cadence — market every 30 minutes, Tribe launches every 10,
          repos every 6 hours — so polling faster than that buys you nothing. Attribution appreciated:
          link the assay page. Not financial advice; an observation, not an accusation.
        </p>
      </section>
    </article>
  );
}
