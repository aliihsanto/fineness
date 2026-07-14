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

type Tab = "all" | "tribe" | "other";
type SortKey = "token" | "fineness" | "fdv" | "volume" | "gap" | "stars" | "devs";
type SortDir = "asc" | "desc";

const BAD_FLAGS = ["FORK", "AI_SLOP", "RUG_WATCH", "DEAD", "SOLO", "FAKE_STARS"] as const;

/** "500k" · "1.5m" · "2b" · "1,000,000" → number; empty/garbage → null (no filter) */
function parseMoney(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[$,\s_]/g, "");
  if (!s) return null;
  const m = /^([\d.]+)([kmb])?$/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  if (!Number.isFinite(n)) return null;
  return n * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] === "b" ? 1e9 : 1);
}

const gradeKey = (total: number) => (total >= 70 ? "high" : total >= 40 ? "alloyed" : "base");

function sortValue(e: LeaderboardEntry, key: SortKey): number | string {
  switch (key) {
    case "token":
      return e.symbol;
    case "fineness":
      return e.total;
    case "fdv":
      return e.fdv ?? -1;
    case "volume":
      return e.volume24h ?? -1;
    case "stars":
      return e.stars;
    case "devs":
      return e.uniqueAuthors30d;
    default:
      return e.realityGap ?? -1;
  }
}

export function LeaderboardTable({
  entries,
  lang,
  initialTab = "all",
}: {
  entries: LeaderboardEntry[];
  lang: Lang;
  initialTab?: Tab;
}) {
  const d = t(lang).home;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState<SortKey>("gap");
  const [dir, setDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [minFdv, setMinFdv] = useState("");
  const [minVol, setMinVol] = useState("");
  const [minMcap, setMinMcap] = useState("");
  const [grades, setGrades] = useState<Set<string>>(new Set());
  const [avoid, setAvoid] = useState<Set<string>>(new Set());
  const [onlyShipping, setOnlyShipping] = useState(false);

  const counts = useMemo(
    () => ({
      all: entries.length,
      tribe: entries.filter((e) => e.platform === "tribe").length,
      other: entries.filter((e) => e.platform !== "tribe").length,
    }),
    [entries],
  );

  const filtered = useMemo(() => {
    const fdvMin = parseMoney(minFdv);
    const volMin = parseMoney(minVol);
    const mcapMin = parseMoney(minMcap);
    return entries.filter((e) => {
      if (tab === "tribe" && e.platform !== "tribe") return false;
      if (tab === "other" && e.platform === "tribe") return false;
      if (fdvMin !== null && (e.fdv ?? 0) < fdvMin) return false;
      if (volMin !== null && (e.volume24h ?? 0) < volMin) return false;
      if (mcapMin !== null && (e.mcap ?? 0) < mcapMin) return false;
      if (grades.size > 0 && !grades.has(gradeKey(e.total))) return false;
      for (const f of avoid) if (e.flags.includes(f)) return false;
      if (onlyShipping && !e.flags.includes("SHIPPING")) return false;
      return true;
    });
  }, [entries, tab, minFdv, minVol, minMcap, grades, avoid, onlyShipping]);

  const sorted = useMemo(() => {
    const a = [...filtered].sort((x, y) => {
      const vx = sortValue(x, sort);
      const vy = sortValue(y, sort);
      const cmp = typeof vx === "string" ? vx.localeCompare(vy as string) : (vx as number) - (vy as number);
      return dir === "asc" ? cmp : -cmp;
    });
    const i = a.findIndex((e) => e.promoted);
    if (i > 0) a.unshift(...a.splice(i, 1)); // house token stays pinned
    return a;
  }, [filtered, sort, dir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rankOffset = (safePage - 1) * PAGE_SIZE;
  const rows = sorted.slice(rankOffset, rankOffset + PAGE_SIZE);

  const clickSort = (key: SortKey) => {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir(key === "token" ? "asc" : "desc");
    }
    setPage(1);
  };

  const toggle = (set: Set<string>, val: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    apply(next);
    setPage(1);
  };

  const hasFilters =
    minFdv || minVol || minMcap || grades.size > 0 || avoid.size > 0 || onlyShipping || tab !== "all";

  const Th = ({ label, k, className = "" }: { label: string; k?: SortKey; className?: string }) => (
    <th className={`py-3 pr-5 font-normal ${className}`}>
      {k ? (
        <button
          onClick={() => clickSort(k)}
          title={d.sortHint}
          className={`cursor-pointer whitespace-nowrap tracking-[0.2em] transition hover:text-gold ${
            sort === k ? "text-gold" : ""
          }`}
        >
          {label}
          <span className="ml-1 inline-block w-2">{sort === k ? (dir === "desc" ? "▼" : "▲") : ""}</span>
        </button>
      ) : (
        label
      )}
    </th>
  );

  const panel = (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-faint">{d.platform}</div>
        <div className="flex flex-col">
          {(["all", "tribe", "other"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={`flex cursor-pointer items-center justify-between border-l-2 px-3 py-2 font-mono text-[11px] tracking-[0.2em] transition ${
                tab === key
                  ? "border-gold bg-gold/5 text-gold"
                  : "border-transparent text-sage hover:border-faint hover:text-bone"
              }`}
            >
              {d.tabs[key]} <span className="text-faint">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {(
          [
            [d.filters.fdv, minFdv, setMinFdv],
            [d.filters.vol, minVol, setMinVol],
            [d.filters.mcap, minMcap, setMinMcap],
          ] as [string, string, (v: string) => void][]
        ).map(([label, value, set]) => (
          <label key={label} className="flex flex-col gap-1">
            <span className="font-mono text-[9px] tracking-[0.25em] text-faint">{label}</span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              placeholder={d.filters.placeholder}
              onChange={(e) => {
                set(e.target.value);
                setPage(1);
              }}
              className={`border bg-panel px-2 py-1.5 font-mono text-xs text-bone outline-none placeholder:text-faint/60 focus:border-gold/60 ${
                value && parseMoney(value) === null ? "border-vermilion/60" : "hairline"
              }`}
            />
          </label>
        ))}
        <div className="font-mono text-[9px] leading-relaxed text-faint">{d.filters.hint}</div>
      </div>

      <div>
        <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-faint">{d.filters.grade}</div>
        <div className="flex flex-col gap-1.5">
          {(
            [
              ["high", d.grades.high, "70-100"],
              ["alloyed", d.grades.alloyed, "40-69"],
              ["base", d.grades.base, "0-39"],
            ] as const
          ).map(([key, label, range]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-sage transition hover:text-bone">
              <input
                type="checkbox"
                checked={grades.has(key)}
                onChange={() => toggle(grades, key, setGrades)}
                className="accent-[#D9B454]"
              />
              {label} <span className="text-faint">{range}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-faint">{d.filters.hide}</div>
        <div className="flex flex-col gap-1.5">
          {BAD_FLAGS.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-sage transition hover:text-bone">
              <input
                type="checkbox"
                checked={avoid.has(f)}
                onChange={() => toggle(avoid, f, setAvoid)}
                className="accent-[#E25D4B]"
              />
              {f.replace("_", " ")}
            </label>
          ))}
          <label className="mt-2 flex cursor-pointer items-center gap-2 font-mono text-[11px] text-jade">
            <input
              type="checkbox"
              checked={onlyShipping}
              onChange={() => {
                setOnlyShipping(!onlyShipping);
                setPage(1);
              }}
              className="accent-[#4FBF7A]"
            />
            {d.filters.shipping}
          </label>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setTab("all");
            setMinFdv("");
            setMinVol("");
            setMinMcap("");
            setGrades(new Set());
            setAvoid(new Set());
            setOnlyShipping(false);
            setPage(1);
          }}
          className="cursor-pointer self-start border hairline px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-faint transition hover:border-gold/60 hover:text-gold"
        >
          {d.filters.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
      <details className="mb-4 border hairline bg-panel lg:hidden">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] tracking-[0.3em] text-gold">
          {d.filtersTitle} {hasFilters ? "●" : ""}
        </summary>
        <div className="border-t hairline p-4">{panel}</div>
      </details>
      <aside className="hidden self-start lg:sticky lg:top-6 lg:block">{panel}</aside>

      <div className="min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b hairline-gold text-left font-mono text-[10px] tracking-[0.2em] text-faint">
                <th className="py-3 pr-3 font-normal">No.</th>
                <Th label={d.th.token} k="token" />
                <Th label={d.th.fineness} k="fineness" />
                <Th label={d.th.fdv} k="fdv" />
                <Th label={d.th.vol} k="volume" />
                <Th label={d.th.gap} k="gap" />
                <Th label={d.th.stars} k="stars" className="hidden 2xl:table-cell" />
                <Th label={d.th.devs} k="devs" className="hidden 2xl:table-cell" />
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
                <tr
                  key={`${e.chain}-${e.symbol}`}
                  className={`border-b hairline align-top transition hover:bg-panel ${e.promoted ? "bg-gold/5" : ""}`}
                >
                  <td className="py-4 pr-3 font-mono text-xs text-faint">
                    {String(rankOffset + i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-4 pr-5">
                    <Link href={`/t/${e.symbol}`} className="group flex flex-col">
                      <span className="flex items-center gap-2 font-mono text-[15px] font-semibold text-bone transition group-hover:text-gold">
                        ${e.symbol}
                        {e.promoted && (
                          <span className="border border-gold/60 bg-gold/15 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.25em] text-gold">
                            {d.promo.stamp}
                          </span>
                        )}
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

        <div className="mt-3 font-mono text-[10px] leading-relaxed tracking-wide text-faint">{d.gapLegend}</div>

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
    </div>
  );
}
