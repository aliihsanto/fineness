export function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtNum(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function fmtPrice(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toPrecision(2)}`;
}

export function fmtAge(days: number | null): string {
  if (days === null) return "—";
  if (days >= 365) return `${(days / 365).toFixed(1)}Y`;
  if (days >= 30) return `${Math.round(days / 30)}MO`;
  return `${days}D`;
}

export const FLAG_META: Record<string, { label: string; good: boolean }> = {
  FORK: { label: "FORK", good: false },
  AI_SLOP: { label: "AI SLOP", good: false },
  RUG_WATCH: { label: "RUG WATCH", good: false },
  DEAD: { label: "DEAD", good: false },
  SOLO: { label: "SOLO", good: false },
  FAKE_STARS: { label: "FAKE STARS", good: false },
  SHIPPING: { label: "SHIPPING", good: true },
};

/** assay grade: verdict word + color for a 0-100 fineness score */
export function gradeFor(total: number): { label: string; color: string } {
  if (total >= 70) return { label: "HIGH PURITY", color: "#4fbf7a" };
  if (total >= 40) return { label: "ALLOYED", color: "#d9a93c" };
  return { label: "BASE METAL", color: "#e25d4b" };
}
