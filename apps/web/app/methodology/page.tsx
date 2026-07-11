import { getLang, t } from "../../lib/i18n";

export const metadata = { title: "Methodology — fineness" };

export default async function Methodology() {
  const lang = await getLang();
  const d = t(lang).methodology;

  return (
    <article className="max-w-3xl">
      <div className="font-mono text-[11px] tracking-[0.35em] text-gold">{d.eyebrow}</div>
      <h1 className="mt-3 font-display text-5xl leading-tight text-bone">{d.title}</h1>
      <p className="mt-5 leading-relaxed text-sage">{d.intro}</p>

      <div className="mt-10 space-y-8">
        {d.sections.map((s) => (
          <section key={s.title} className="border-l-2 pl-5" style={{ borderColor: "rgba(217,180,84,0.35)" }}>
            <h2 className="font-mono text-xs font-semibold tracking-[0.25em] text-bone">{s.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-sage">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold tracking-[0.25em] text-gold">{d.gapTitle}</h2>
        <p className="mt-2 leading-relaxed text-sage">
          <code className="bg-panel px-1.5 py-0.5 font-mono text-sm text-gold">
            realityGap = FDV / max(finenessScore, 1)
          </code>{" "}
          {d.gapBody}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs font-semibold tracking-[0.25em] text-gold">{d.transparencyTitle}</h2>
        <p className="mt-2 leading-relaxed text-sage">{d.transparencyBody}</p>
      </section>
    </article>
  );
}
