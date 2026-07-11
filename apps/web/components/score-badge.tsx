import { gradeFor } from "../lib/format";

/** compact hallmark: colored score + grade word */
export function ScoreBadge({ total, size = "md" }: { total: number; size?: "md" | "lg" }) {
  const g = gradeFor(total);
  if (size === "lg") {
    return (
      <div
        className="flex w-64 flex-col items-center border-2 px-6 pb-5 pt-4"
        style={{ borderColor: "rgba(217,180,84,0.4)", background: "linear-gradient(150deg, #131c16, #0c110e)" }}
      >
        <span className="font-mono text-xs font-semibold tracking-[0.5em] text-gold">FINENESS</span>
        <span className="font-display text-8xl leading-none" style={{ color: g.color }}>
          {total}
        </span>
        <span className="font-mono text-xs tracking-[0.35em] text-sage">OF 100</span>
        <span className="mt-3 w-40 border-t hairline-gold" />
        <span className="mt-3 font-mono text-xs font-semibold tracking-[0.3em]" style={{ color: g.color }}>
          {g.label}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col leading-none">
      <span className="font-mono text-xl font-semibold" style={{ color: g.color }}>
        {total}
        <span className="text-xs text-faint">/100</span>
      </span>
      <span className="mt-1 font-mono text-[9px] tracking-[0.2em]" style={{ color: g.color }}>
        {g.label}
      </span>
    </div>
  );
}
