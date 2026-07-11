"use client";

import { gradeFor } from "../lib/format";

export function ShareButton({
  symbol,
  total,
  flags,
  label = "SHARE ON X",
}: {
  symbol: string;
  total: number;
  flags: string[];
  label?: string;
}) {
  const share = () => {
    const site = window.location.origin;
    const grade = gradeFor(total).label;
    const worst = flags.filter((f) => f !== "SHIPPING").slice(0, 3).join(" · ");
    const text = `$${symbol} fineness score: ${total}/100 — ${grade}${worst ? `\n${worst}` : ""}\n${site}/t/${symbol}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  return (
    <button
      onClick={share}
      className="cursor-pointer border border-gold/60 bg-gold/10 px-5 py-2.5 font-mono text-[11px] font-semibold tracking-[0.25em] text-gold transition hover:bg-gold hover:text-ink"
    >
      {label}
    </button>
  );
}
