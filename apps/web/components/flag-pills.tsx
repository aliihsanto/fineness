import { FLAG_META } from "../lib/format";

/** inspection seals — text-only stamps, vermilion for defects, jade for shipping */
export function FlagPills({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => {
        const meta = FLAG_META[f] ?? { label: f, good: false };
        const c = meta.good ? "#4fbf7a" : "#e25d4b";
        return (
          <span
            key={f}
            className="rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em]"
            style={{ borderColor: `${c}99`, color: c, background: `${c}0f` }}
          >
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
