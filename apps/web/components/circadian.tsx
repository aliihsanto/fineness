/**
 * 24h UTC commit-hour histogram — the circadian fingerprint.
 * A real team leaves a 4+ hour empty block (sleep); machines don't.
 */
export function CircadianChart({ data, height = 90 }: { data: number[]; height?: number }) {
  if (data.length !== 24) return null;
  const max = Math.max(...data, 1);
  const barW = 30;
  const gap = 6;
  const labelH = 20;
  const width = 24 * (barW + gap) - gap;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height + labelH}`}
      role="img"
      aria-label="commits by hour of day"
      style={{ maxWidth: width }}
    >
      {data.map((v, h) => {
        const barH = Math.max((v / max) * (height - 8), v > 0 ? 4 : 2);
        return (
          <rect
            key={h}
            x={h * (barW + gap)}
            y={height - barH}
            width={barW}
            height={barH}
            rx={2}
            fill={v > 0 ? "#8f7420" : "#1c2620"}
          />
        );
      })}
      {[0, 6, 12, 18].map((h) => (
        <text
          key={h}
          x={h * (barW + gap) + barW / 2}
          y={height + 15}
          textAnchor="middle"
          fill="#5d6960"
          fontSize={11}
          fontFamily="var(--font-plex-mono), monospace"
        >
          {String(h).padStart(2, "0")}
        </text>
      ))}
    </svg>
  );
}
