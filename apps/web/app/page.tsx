import Link from "next/link";
import { getLeaderboard, getStats } from "../lib/data";
import { fmtUsd } from "../lib/format";
import { getLang, t } from "../lib/i18n";
import type { LeaderboardEntry } from "../lib/types";
import { LeaderboardTable } from "../components/leaderboard-table";

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

type Search = { tab?: string; minFdv?: string; minVol?: string; minMcap?: string; grade?: string };

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
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "all";
  const lang = await getLang();
  const d = t(lang).home;
  const [all, stats] = await Promise.all([getLeaderboard(), getStats()]);
  const filtered = applyFilters(all, { ...params, tab });
  const counts = {
    all: all.length,
    tribe: all.filter((e) => e.platform === "tribe").length,
    other: all.filter((e) => e.platform !== "tribe").length,
  };
  const hasFilters = Boolean(params.minFdv || params.minVol || params.minMcap || params.grade);
  const panel = <FilterPanel d={d} params={params} tab={tab} counts={counts} hasFilters={hasFilters} />;

  return (
    <div>
      <section className="mb-8">
        <div className="font-mono text-[11px] tracking-[0.35em] text-gold">{d.eyebrow}</div>
        <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-bone sm:text-5xl">{d.title}</h1>
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

      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <details className="mb-4 border hairline bg-panel lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] tracking-[0.3em] text-gold">
            {d.filtersTitle}
          </summary>
          <div className="border-t hairline p-4">{panel}</div>
        </details>
        <aside className="hidden self-start lg:sticky lg:top-6 lg:block">{panel}</aside>

        <LeaderboardTable entries={filtered} lang={lang} />
      </div>
    </div>
  );
}

function FilterPanel({
  d,
  params,
  tab,
  counts,
  hasFilters,
}: {
  d: ReturnType<typeof t>["home"];
  params: Search;
  tab: Tab;
  counts: Record<Tab, number>;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-faint">{d.platform}</div>
        <div className="flex flex-col">
          {TABS.map((key) => (
            <Link
              key={key}
              href={query(params, { tab: key === "all" ? undefined : key })}
              className={`flex items-center justify-between border-l-2 px-3 py-2 font-mono text-[11px] tracking-[0.2em] transition ${
                tab === key
                  ? "border-gold bg-gold/5 text-gold"
                  : "border-transparent text-sage hover:border-faint hover:text-bone"
              }`}
            >
              {d.tabs[key]} <span className="text-faint">{counts[key]}</span>
            </Link>
          ))}
        </div>
      </div>

      <form method="GET" action="/" className="flex flex-col gap-3">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
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
        <div className="mt-1 flex items-center gap-3">
          <button
            type="submit"
            className="cursor-pointer border border-gold/60 bg-gold/10 px-4 py-1.5 font-mono text-[10px] font-semibold tracking-[0.25em] text-gold transition hover:bg-gold hover:text-ink"
          >
            {d.filters.apply}
          </button>
          {hasFilters && (
            <Link
              href={query({ tab: params.tab }, {})}
              className="font-mono text-[10px] tracking-[0.25em] text-faint transition hover:text-bone"
            >
              {d.filters.clear}
            </Link>
          )}
        </div>
      </form>
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
