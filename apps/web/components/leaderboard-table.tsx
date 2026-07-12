"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { t, type Lang } from "../lib/i18n-dict";
import { fmtAge, fmtNum, fmtUsd } from "../lib/format";
import type { LeaderboardEntry } from "../lib/types";
import { ScoreBadge } from "./score-badge";
import { FlagPills } from "./flag-pills";
import { CommitTimeline } from "./commit-timeline";

const PAGE_SIZE = 20;
type SortKey = "gap" | "fineness" | "fdv" | "volume";
const SORT_KEYS: SortKey[] = ["gap", "fineness", "fdv", "volume"];

function sortEntries(entries: LeaderboardEntry[], sort: SortKey): LeaderboardEntry[] {
  const a = [...entries];
  switch (sort) {
    case "fineness":
      return a.sort((x, y) => x.total - y.total); // worst first — the product thesis
    case "fdv":
      return a.sort((x, y) => (y.fdv ?? -1) - (x.fdv ?? -1));
    case "volume":
      return a.sort((x, y) => (y.volume24h ?? -1) - (x.volume24h ?? -1));
    default:
      return a.sort((x, y) => (y.realityGap ?? -1) - (x.realityGap ?? -1));
  }
}

export function LeaderboardTable({ entries, lang }: { entries: LeaderboardEntry[]; lang: Lang }) {
  const d = t(lang).home;
  const [sort, setSort] = useState<SortKey>("gap");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => sortEntries(entries, sort), [entries, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rankOffset = (safePage - 1) * PAGE_SIZE;
  const rows = sorted.slice(rankOffset, rankOffset + PAGE_SIZE);

  const pick = (key: SortKey) => {
    setSort(key);
    setPage(1);
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-4 overflow-x-auto font-mono text-[10px] tracking-[0.25em] text-faint">
        <span className="shrink-0">{d.sortBy}</span>
        {SORT_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => pick(key)}
            className={`shrink-0 cursor-pointer border-b pb-0.5 transition ${
              sort === key ? "border-gold text-gold" : "border-transparent text-sage hover:text-bone"
            }`}
          >
            {d.sorts[key]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b hairline-gold text-left font-mono text-[10px] tracking-[0.2em] text-faint">
              <th className="py-3 pr-3 font-normal">No.</th>
              <th className="py-3 pr-5 font-normal">{d.th.token}</th>
              <th className="py-3 pr-5 font-normal">{d.th.fineness}</th>
              <th className="py-3 pr-5 font-normal">{d.th.fdv}</th>
              <th className="py-3 pr-5 font-normal">{d.th.vol}</th>
              <th className="py-3 pr-5 font-normal">{d.th.gap}</th>
              <th className="hidden py-3 pr-5 font-normal 2xl:table-cell">{d.th.stars}</th>
              <th className="hidden py-3 pr-5 font-normal 2xl:table-cell">{d.th.devs}</th>
              <th className="py-3 pr-5 font-normal">{d.th.flags}</th>
              <th className="hidden py-3 font-normal xl:table-cell">{d.th.weeks}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center font-mono text-xs tracking-[0.2em] text-faint">
                  {d.noMatch}
                </td>
              </tr>
            )}
            {rows.map((e, i) => (
              <tr key={`${e.chain}-${e.symbol}`} className="border-b hairline align-top transition hover:bg-panel">
                <td className="py-4 pr-3 font-mono text-xs text-faint">
                  {String(rankOffset + i + 1).padStart(2, "0")}
                </td>
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
                <td className="hidden py-4 pr-5 2xl:table-cell">
                  <div className="font-mono text-sm text-sage">{fmtNum(e.stars)}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {fmtNum(e.forks)} {d.forks}
                  </div>
                </td>
                <td className="hidden py-4 pr-5 2xl:table-cell">
                  <div className="font-mono text-sm text-sage">{e.uniqueAuthors30d}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-faint">
                    {e.commits30d} {d.commits}
                  </div>
                </td>
                <td className="max-w-52 py-4 pr-5">
                  <FlagPills flags={e.flags} />
                </td>
                <td className="hidden py-4 xl:table-cell">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[0.2em] text-faint">
        <span>
          {d.showing(
            sorted.length === 0 ? 0 : rankOffset + 1,
            Math.min(rankOffset + PAGE_SIZE, sorted.length),
            sorted.length,
          )}
        </span>
        {pageCount > 1 && (
          <span className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="cursor-pointer border hairline px-3 py-1.5 text-sage transition enabled:hover:border-gold/60 enabled:hover:text-gold disabled:opacity-40"
            >
              {d.prev}
            </button>
            {Array.from({ length: pageCount }, (_, p) => (
              <button
                key={p}
                onClick={() => setPage(p + 1)}
                className={`cursor-pointer px-2 py-1.5 transition ${
                  safePage === p + 1 ? "text-gold" : "text-sage hover:text-bone"
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage === pageCount}
              className="cursor-pointer border hairline px-3 py-1.5 text-sage transition enabled:hover:border-gold/60 enabled:hover:text-gold disabled:opacity-40"
            >
              {d.next}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
