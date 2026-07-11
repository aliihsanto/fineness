import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntryBySymbol } from "../../../lib/data";
import { fmtAge, fmtNum, fmtPrice, fmtUsd, gradeFor } from "../../../lib/format";
import { getLang, t } from "../../../lib/i18n";
import { assayNotes } from "../../../lib/notes";
import { ScoreBadge } from "../../../components/score-badge";
import { FlagPills } from "../../../components/flag-pills";
import { CommitTimeline } from "../../../components/commit-timeline";
import { CircadianChart } from "../../../components/circadian";
import { ShareButton } from "../../../components/share-button";

type Props = { params: Promise<{ symbol: string }> };

const SUB_MAX: Record<string, number> = {
  authenticity: 30,
  antislop: 25,
  busfactor: 15,
  momentum: 20,
  community: 10,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const entry = await getEntryBySymbol(symbol);
  if (!entry) return {};
  const title = `$${entry.symbol} — fineness score ${entry.total}/100`;
  return {
    title,
    openGraph: { title, images: [`/og/${entry.symbol}`] },
    twitter: { card: "summary_large_image", title, images: [`/og/${entry.symbol}`] },
  };
}

export default async function TokenPage({ params }: Props) {
  const { symbol } = await params;
  const entry = await getEntryBySymbol(symbol);
  if (!entry) notFound();

  const lang = await getLang();
  const d = t(lang).token;
  const notes = assayNotes(entry, lang);
  const grade = gradeFor(entry.total);
  const defects = entry.flags.filter((f) => f !== "SHIPPING").length;
  const verdict = d.verdict(
    entry.total,
    grade.label,
    defects,
    entry.realityGap === null ? null : `${fmtUsd(entry.realityGap)}/PT`,
  );

  return (
    <div>
      {/* certificate frame */}
      <div className="border p-1.5 hairline-gold" style={{ borderWidth: 1.5 }}>
        <div className="border p-8 sm:p-10" style={{ borderColor: "rgba(217,180,84,0.13)" }}>
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-faint">
            <span className="text-gold">{d.assayReport}</span>
            <span>ALGO v0.1</span>
          </div>

          <div className="mt-8 flex flex-wrap items-start justify-between gap-10">
            <div className="min-w-0">
              <h1 className="font-display text-6xl leading-none text-bone">${entry.symbol}</h1>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                {entry.tokenName} · {entry.chain} · {entry.platform}
                {entry.launchedDaysAgo !== null ? ` · ${d.launched(entry.launchedDaysAgo)}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                {entry.demo ? (
                  <span className="inline-flex items-baseline gap-2 font-mono text-sm text-sage">
                    {entry.repoFullName}
                    <span className="border border-brass/50 bg-brass/10 px-1.5 py-0.5 text-[9px] tracking-[0.15em] text-brass">
                      {d.demoRepo}
                    </span>
                  </span>
                ) : (
                  <a
                    href={`https://github.com/${entry.repoFullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-sage transition hover:text-gold"
                  >
                    {entry.repoFullName} ↗
                  </a>
                )}
                {entry.mintAddress && (
                  <a
                    href={`https://dexscreener.com/${entry.chain}/${entry.mintAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] tracking-[0.15em] text-gold/80 transition hover:text-gold"
                  >
                    DEXSCREENER ↗
                  </a>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px] tracking-wider text-sage">
                <span>
                  {d.fdv} <span className="text-bone">{fmtUsd(entry.fdv)}</span>
                </span>
                <span>
                  {d.gap}{" "}
                  <span className="text-gold">
                    {entry.realityGap === null ? "—" : `${fmtUsd(entry.realityGap)}/PT`}
                  </span>
                </span>
                <span>
                  {d.lastCommit}{" "}
                  <span className="text-bone">
                    {entry.lastCommitDaysAgo === 0 ? d.today : d.daysAgo(entry.lastCommitDaysAgo)}
                  </span>
                </span>
              </div>
              <div className="mt-6">
                <FlagPills flags={entry.flags} />
              </div>
              <p className="mt-6 max-w-xl border-l-2 pl-4 text-[14px] leading-relaxed text-sage" style={{ borderColor: grade.color }}>
                {verdict}
              </p>
              <div className="mt-8">
                <ShareButton symbol={entry.symbol} total={entry.total} flags={entry.flags} label={d.share} />
              </div>
            </div>

            <ScoreBadge total={entry.total} size="lg" />
          </div>
        </div>
      </div>

      {/* market + repository panels */}
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section>
          <SectionTitle>{d.sections.market}</SectionTitle>
          <dl className="mt-5 grid grid-cols-2 gap-x-6">
            <Row k={d.market.price} v={fmtPrice(entry.priceUsd)} />
            <Row k={d.market.fdv} v={fmtUsd(entry.fdv)} />
            <Row k={d.market.mcap} v={fmtUsd(entry.mcap)} />
            <Row k={d.market.vol} v={fmtUsd(entry.volume24h)} />
            <Row k={d.market.liq} v={fmtUsd(entry.liquidity)} />
            <Row k={d.market.holders} v={entry.holders === null ? "—" : fmtNum(entry.holders)} />
          </dl>
        </section>
        <section>
          <SectionTitle>{d.sections.repository}</SectionTitle>
          <dl className="mt-5 grid grid-cols-2 gap-x-6">
            <Row k={d.repo.stars} v={fmtNum(entry.stars)} />
            <Row k={d.repo.forks} v={fmtNum(entry.forks)} />
            <Row k={d.repo.watchers} v={fmtNum(entry.watchers)} />
            <Row k={d.repo.issues} v={fmtNum(entry.openIssues)} />
            <Row k={d.repo.language} v={entry.language ?? "—"} />
            <Row k={d.repo.license} v={entry.license ?? d.repo.none} warn={entry.license === null} />
            <Row k={d.repo.age} v={fmtAge(entry.ageDays)} />
            <Row k={d.repo.commits30} v={String(entry.commits30d)} />
            <Row k={d.repo.devs30} v={String(entry.uniqueAuthors30d)} />
            <Row
              k={d.repo.decay}
              v={entry.decayRatio === null ? "—" : `${entry.decayRatio.toFixed(2)}×`}
              warn={entry.decayRatio !== null && entry.decayRatio < 0.2}
            />
          </dl>
        </section>
      </div>

      {/* assay notes */}
      {notes.length > 0 && (
        <section className="mt-12">
          <SectionTitle>{d.sections.notes}</SectionTitle>
          <ul className="mt-5 space-y-2.5">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
                <span className="mt-0.5 font-mono text-xs" style={{ color: n.good ? "#4fbf7a" : "#e25d4b" }}>
                  {n.good ? "+" : "−"}
                </span>
                <span className="text-sage">{n.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* purity bars */}
      <section className="mt-12">
        <SectionTitle>{d.sections.subscores}</SectionTitle>
        <div className="mt-6 space-y-6">
          {d.subs.map((s) => {
            const score = entry[s.key as "authenticity" | "antislop" | "busfactor" | "momentum" | "community"];
            const max = SUB_MAX[s.key]!;
            const pct = (score / max) * 100;
            return (
              <div key={s.key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-mono text-xs tracking-[0.2em] text-bone">
                    {s.name} <span className="ml-2 normal-case tracking-normal text-faint">{s.desc}</span>
                  </span>
                  <span className="font-mono text-sm text-sage">
                    {score}
                    <span className="text-faint">/{max}</span>
                  </span>
                </div>
                <div className="relative h-2 bg-raised">
                  <div
                    className="h-2"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #a9821f, #d9b454)" }}
                  />
                  <div className="ruler absolute inset-0" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* circadian fingerprint */}
      {entry.hourHistogram.length === 24 && (
        <section className="mt-12">
          <SectionTitle>{d.sections.hours}</SectionTitle>
          <div className="mt-6 border hairline bg-panel p-6">
            <CircadianChart data={entry.hourHistogram} />
            <p className="mt-4 max-w-xl font-mono text-[11px] leading-relaxed tracking-wide text-faint">
              {d.hoursCaption}
            </p>
          </div>
        </section>
      )}

      {/* activity */}
      <section className="mt-12">
        <SectionTitle>{d.sections.activity}</SectionTitle>
        <div className="mt-6 border hairline bg-panel p-6">
          <CommitTimeline data={entry.commitTimeline} width={520} height={80} />
        </div>
      </section>

      {/* raw signals */}
      <section className="mt-12">
        <SectionTitle>{d.sections.signals}</SectionTitle>
        <p className="mt-2 font-mono text-[11px] tracking-wide text-faint">{d.signalsHint}</p>
        <pre className="mt-4 overflow-x-auto border hairline bg-panel p-5 font-mono text-xs leading-relaxed text-sage">
          {JSON.stringify(entry.signals, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-mono text-[11px] tracking-[0.35em] text-gold">{children}</h2>
      <span className="h-px flex-1 border-t hairline" />
    </div>
  );
}

function Row({ k, v, warn = false }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b hairline py-2.5">
      <dt className="font-mono text-[10px] tracking-[0.2em] text-faint">{k}</dt>
      <dd className={`font-mono text-sm ${warn ? "text-vermilion" : "text-bone"}`}>{v}</dd>
    </div>
  );
}
