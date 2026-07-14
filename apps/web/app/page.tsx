import Link from "next/link";
import { getLeaderboard, getStats } from "../lib/data";
import { fmtUsd } from "../lib/format";
import { getLang, t } from "../lib/i18n";
import { ScoreBadge } from "../components/score-badge";
import { LeaderboardTable } from "../components/leaderboard-table";

const TABS = ["all", "tribe", "other"] as const;
type Tab = (typeof TABS)[number];

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function Leaderboard({ searchParams }: Props) {
  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "all";
  const lang = await getLang();
  const d = t(lang).home;
  const [all, stats] = await Promise.all([getLeaderboard(), getStats()]);
  const promoted = all.find((e) => e.promoted) ?? null;

  return (
    <div>
      <section className="mb-6">
        <div className="flex flex-col gap-x-10 gap-y-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.35em] text-gold">{d.eyebrow}</div>
            <h1 className="mt-1.5 font-display text-2xl leading-tight text-bone sm:text-3xl">{d.title}</h1>
          </div>
          <p className="max-w-xl text-[13px] leading-relaxed text-sage lg:pb-0.5">
            {d.introA}
            <span className="text-bone">{d.gapWord}</span>
            {d.introB}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-stretch border-y hairline-gold">
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

      {promoted && (
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 border border-gold/40 bg-gold/5 px-4 py-3 sm:px-5">
          <span className="border border-gold/60 bg-gold/15 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.3em] text-gold">
            {d.promo.stamp}
          </span>
          <Link href={`/t/${promoted.symbol}`} className="group flex items-center gap-3">
            <span className="font-mono text-[15px] font-semibold text-bone transition group-hover:text-gold">
              ${promoted.symbol}
            </span>
            <ScoreBadge total={promoted.total} />
          </Link>
          {promoted.fdv !== null && (
            <span className="font-mono text-xs text-sage">
              FDV <span className="text-bone">{fmtUsd(promoted.fdv)}</span>
            </span>
          )}
          <span className="hidden max-w-md text-[12px] leading-snug text-sage md:block">{d.promo.blurb}</span>
          <span className="ml-auto flex items-center gap-4 font-mono text-[10px] tracking-[0.2em]">
            <Link href={`/t/${promoted.symbol}`} className="text-gold transition hover:text-bone">
              {d.promo.view}
            </Link>
            {promoted.mintAddress && (
              <a
                href={`https://tribe.run/token/${promoted.mintAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-sage transition hover:text-gold"
              >
                {d.promo.trade}
              </a>
            )}
          </span>
        </div>
      )}

      <LeaderboardTable entries={all} lang={lang} initialTab={tab} />
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
    <div className={`mr-5 flex flex-col gap-0.5 py-3 pr-5 sm:mr-6 sm:pr-6 ${last ? "" : "border-r hairline"}`}>
      <span className={`font-mono text-lg sm:text-xl ${accent === "jade" ? "text-jade" : "text-bone"}`}>{value}</span>
      <span className="font-mono text-[9px] tracking-[0.25em] text-faint sm:text-[10px]">{label}</span>
    </div>
  );
}
