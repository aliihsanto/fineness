/** Weekly-commit sparkline, pure SVG — ledger bars in muted gold. */
export function CommitTimeline({
  data,
  width = 240,
  height = 48,
  color = "#8f7420",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return <span className="font-mono text-[10px] tracking-widest text-faint">NO TIMELINE YET</span>;
  }
  const max = Math.max(...data, 1);
  const barW = width / data.length;
  return (
    <svg width={width} height={height} role="img" aria-label="weekly commits">
      {data.map((v, i) => {
        const h = Math.max((v / max) * (height - 4), v > 0 ? 3 : 1.5);
        return (
          <rect
            key={i}
            x={i * barW + 1}
            y={height - h}
            width={Math.max(barW - 2.5, 2)}
            height={h}
            rx={1}
            fill={v > 0 ? color : "#1c2620"}
          />
        );
      })}
    </svg>
  );
}
