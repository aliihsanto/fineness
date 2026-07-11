import Link from "next/link";
import { getLeaderboard, getStats, type SortKey } from "../lib/data";
import { fmtAge, fmtNum, fmtUsd } from "../lib/format";
import { getLang, t } from "../lib/i18n";
import { ScoreBadge } from "../components/score-badge";
import { FlagPills } from "../components/flag-pills";
import { CommitTimeline } from "../components/commit-timeline";

const SORT_KEYS: SortKey[] = ["gap", "fineness", "fdv", "volume"];

type Props = { searchParams: Promise<{ sort?: string }> };

export default async function Leaderboard({ searchParams }: Props) {
  const { sort: rawSort } = await searchParams;
  const sort: SortKey = SORT_KEYS.includes(rawSort as SortKey) ? (rawSort as SortKey) : "gap";
  const lang = await getLang();
  const d = t(lang).home;
  const [entries, stats] = await Promise.all([getLeaderboard(sort), getStats()]);

  return (
    <div>
      <section className="mb-10">
        <div className="font-mono text-[11px] tracking-[0.35em] text-gold">{d.eyebrow}</div>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-bone">{d.title}</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sage">
          {d.introA}
          <span className="text-bone">{d.gapWord}</span>
          {d.introB}
        </p>

        <div className="mt-8 flex flex-wrap items-stretch border-y hairline-gold">
          <Stat label={d.stats.repos} value={String(stats.reposScanned)} />
          <Stat label={d.stats.fdv} value={fmtUsd(stats.totalFdv)} />
          <Stat label={d.stats.median} value={`${stats.medianFinenessScore}/100`} />
          <Stat label={d.stats.forks} value={`${stats.forkPct}%`} />
          <Stat label={d.stats.slop} value={`${stats.slopPct}%`} />
          <Stat label={d.stats.dead} value={`${stats.deadPct}%`} />
          <Stat label={d.stats.shipping} value={`${stats.shippingPct}%`} accent="jade" last />
        </div>
        {stats.demo && (
          <div className="mt-3">
            <span className="border border-brass/50 bg-brass/10 px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-brass">
              {d.demoBadge}
            </span>
          </div>
        )}
      </section>

      <div className="mb-3 flex items-center gap-4 font-mono text-[10px] tracking-[0.25em] text-faint">
        <span>{d.sortBy}</span>
        {SORT_KEYS.map((key) => (
          <Link
            key={key}
            href={key === "gap" ? "/" : `/?sort=${key}`}
            className={`border-b pb-0.5 transition ${
              sort === key ? "border-gold text-gold" : "border-transparent text-sage hover:text-bone"
            }`}
          >
            {d.sorts[key]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b hairline-gold text-left font-mono text-[10px] tracking-[0.2em] text-faint">
              <th className="py-3 pr-3 font-normal">No.</th>
              <th className="py-3 pr-5 font-normal">{d.th.token}</th>
              <th className="py-3 pr-5 font-normal">{d.th.fineness}</th>
              <th className="py-3 pr-5 font-normal">{d.th.fdv}</th>
              <th className="py-3 pr-5 font-normal">{d.th.vol}</th>
              <th className="py-3 pr-5 font-normal">{d.th.gap}</th>
              <th className="hidden py-3 pr-5 font-normal xl:table-cell">{d.th.stars}</th>
              <th className="hidden py-3 pr-5 font-normal xl:table-cell">{d.th.devs}</th>
              <th className="py-3 pr-5 font-normal">{d.th.flags}</th>
              <th className="hidden py-3 font-normal lg:table-cell">{d.th.weeks}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.symbol} className="border-b hairline align-top transition hover:bg-panel">
                <td className="py-4 pr-3 font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-4 pr-5">
                  <Link href={`/t/${e.symbol}`} className="group flex flex-col">
                    <span className="font-mono text-[15px] font-semibold text-bone transition group-hover:text-gold">
                      ${e.symbol}
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] text-faint">{e.repoFullName}</span>
                    <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                      {e.chain} · {e.platform}
                      {e.language ? ` · ${e.language}` : ""}
                    </span>
                  </Link>
                </td>
                <td className="py-4 pr-5">
                  <ScoreBadge total={e.total} />
                </td>
                <td className="py-4 pr-5">
                  <div className="font-mono text-sm text-sage">{fmtUsd(e.fdv)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {d.liq} {fmtUsd(e.liquidity)}
                  </div>
                </td>
                <td className="py-4 pr-5">
                  <div className="font-mono text-sm text-sage">{fmtUsd(e.volume24h)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {e.holders === null ? "—" : `${fmtNum(e.holders)} ${d.holders}`}
                  </div>
                </td>
                <td className="py-4 pr-5">
                  <span className="font-mono text-sm text-gold">
                    {e.realityGap === null ? "—" : fmtUsd(e.realityGap)}
                  </span>
                  {e.realityGap !== null && <span className="font-mono text-[10px] text-faint"> /PT</span>}
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {e.lastCommitDaysAgo === 0 ? d.pushedToday : d.lastPush(e.lastCommitDaysAgo)}
                  </div>
                </td>
                <td className="hidden py-4 pr-5 xl:table-cell">
                  <div className="font-mono text-sm text-sage">{fmtNum(e.stars)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {fmtNum(e.forks)} {d.forks}
                  </div>
                </td>
                <td className="hidden py-4 pr-5 xl:table-cell">
                  <div className="font-mono text-sm text-sage">{e.uniqueAuthors30d}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {e.commits30d} {d.commits}
                  </div>
                </td>
                <td className="max-w-52 py-4 pr-5">
                  <FlagPills flags={e.flags} />
                </td>
                <td className="hidden py-4 lg:table-cell">
                  <CommitTimeline data={e.commitTimeline} width={140} height={30} />
                  <div className="mt-1 font-mono text-[10px] text-faint">
                    {d.repoAge} {fmtAge(e.ageDays)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  last = false,
  accent,
}: {
  label: string;
  value: string;
  last?: boolean;
  accent?: "jade";
}) {
  return (
    <div className={`mr-7 flex flex-col gap-1 py-4 pr-7 ${last ? "" : "border-r hairline"}`}>
      <span className={`font-mono text-2xl ${accent === "jade" ? "text-jade" : "text-bone"}`}>{value}</span>
      <span className="font-mono text-[10px] tracking-[0.25em] text-faint">{label}</span>
    </div>
  );
}
