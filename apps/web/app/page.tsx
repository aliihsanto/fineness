import Link from "next/link";
import { getLeaderboard, getStats, type SortKey } from "../lib/data";
import { fmtAge, fmtNum, fmtUsd, gradeFor } from "../lib/format";
import { getLang, t } from "../lib/i18n";
import type { LeaderboardEntry } from "../lib/types";
import { ScoreBadge } from "../components/score-badge";
import { FlagPills } from "../components/flag-pills";
import { CommitTimeline } from "../components/commit-timeline";

const SORT_KEYS: SortKey[] = ["gap", "fineness", "fdv", "volume"];
const TABS = ["all", "tribe", "other"] as const;
type Tab = (typeof TABS)[number];

const MONEY_STEPS = [
  { value: "", label: "—" },
  { value: "100000", label: "$100K" },
  { value: "1000000", label: "$1M" },
  { value: "10000000", label: "$10M" },
  { value: "100000000", label: "$100M" },
  { value: "1000000000", label: "$1B" },
];

type Search = {
  sort?: string;
  tab?: string;
  minFdv?: string;
  minVol?: string;
  minMcap?: string;
  grade?: string;
};

function query(params: Search, overrides: Partial<Search>): string {
  const merged: Record<string, string | undefined> = { ...params, ...overrides };
  const q = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return q ? `/?${q}` : "/";
}

function applyFilters(entries: LeaderboardEntry[], s: Search): LeaderboardEntry[] {
  return entries.filter((e) => {
    if (s.tab === "tribe" && e.platform !== "tribe") return false;
    if (s.tab === "other" && e.platform === "tribe") return false;
    if (s.minFdv && (e.fdv ?? 0) < Number(s.minFdv)) return false;
    if (s.minVol && (e.volume24h ?? 0) < Number(s.minVol)) return false;
    if (s.minMcap && (e.mcap ?? 0) < Number(s.minMcap)) return false;
    if (s.grade) {
      const g = e.total >= 70 ? "high" : e.total >= 40 ? "alloyed" : "base";
      if (g !== s.grade) return false;
    }
    return true;
  });
}

type Props = { searchParams: Promise<Search> };

export default async function Leaderboard({ searchParams }: Props) {
  const params = await searchParams;
  const sort: SortKey = SORT_KEYS.includes(params.sort as SortKey) ? (params.sort as SortKey) : "gap";
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "all";
  const lang = await getLang();
  const d = t(lang).home;
  const [all, stats] = await Promise.all([getLeaderboard(sort), getStats()]);
  const entries = applyFilters(all, { ...params, tab });
  const counts = {
    all: all.length,
    tribe: all.filter((e) => e.platform === "tribe").length,
    other: all.filter((e) => e.platform !== "tribe").length,
  };
  const hasFilters = Boolean(params.minFdv || params.minVol || params.minMcap || params.grade);

  return (
    <div>
      <section className="mb-8">
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

      {/* platform tabs */}
      <div className="flex border-b hairline-gold">
        {TABS.map((key) => (
          <Link
            key={key}
            href={query(params, { tab: key === "all" ? undefined : key })}
            className={`-mb-px border-b-2 px-5 py-2.5 font-mono text-[11px] tracking-[0.25em] transition ${
              tab === key
                ? "border-gold text-gold"
                : "border-transparent text-sage hover:text-bone"
            }`}
          >
            {d.tabs[key]} <span className="text-faint">{counts[key]}</span>
          </Link>
        ))}
      </div>

      {/* filters */}
      <form method="GET" action="/" className="mt-4 flex flex-wrap items-end gap-4">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        {sort !== "gap" && <input type="hidden" name="sort" value={sort} />}
        <Filter name="minFdv" label={d.filters.fdv} value={params.minFdv} options={MONEY_STEPS} />
        <Filter name="minVol" label={d.filters.vol} value={params.minVol} options={MONEY_STEPS} />
        <Filter name="minMcap" label={d.filters.mcap} value={params.minMcap} options={MONEY_STEPS} />
        <Filter
          name="grade"
          label={d.filters.grade}
          value={params.grade}
          options={[
            { value: "", label: d.filters.any },
            { value: "base", label: d.grades.base },
            { value: "alloyed", label: d.grades.alloyed },
            { value: "high", label: d.grades.high },
          ]}
        />
        <button
          type="submit"
          className="cursor-pointer border border-gold/60 bg-gold/10 px-4 py-1.5 font-mono text-[10px] font-semibold tracking-[0.25em] text-gold transition hover:bg-gold hover:text-ink"
        >
          {d.filters.apply}
        </button>
        {hasFilters && (
          <Link
            href={query({ sort: params.sort, tab: params.tab }, {})}
            className="py-1.5 font-mono text-[10px] tracking-[0.25em] text-faint transition hover:text-bone"
          >
            {d.filters.clear}
          </Link>
        )}
      </form>

      <div className="mb-3 mt-5 flex items-center gap-4 font-mono text-[10px] tracking-[0.25em] text-faint">
        <span>{d.sortBy}</span>
        {SORT_KEYS.map((key) => (
          <Link
            key={key}
            href={query(params, { sort: key === "gap" ? undefined : key })}
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
            {entries.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center font-mono text-xs tracking-[0.2em] text-faint">
                  {d.noMatch}
                </td>
              </tr>
            )}
            {entries.map((e, i) => (
              <tr key={`${e.chain}-${e.symbol}`} className="border-b hairline align-top transition hover:bg-panel">
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

function Filter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] tracking-[0.25em] text-faint">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="border hairline bg-panel px-2 py-1.5 font-mono text-xs text-bone outline-none focus:border-gold/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
