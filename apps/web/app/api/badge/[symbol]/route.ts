import { getEntryBySymbol } from "../../../../lib/data";

export const dynamic = "force-dynamic";

const GRADE = (total: number) =>
  total >= 70 ? "#4FBF7A" : total >= 40 ? "#D9A93C" : "#E25D4B";

/** ~Verdana 11px width estimate — the same trick shields.io uses */
const w = (s: string) => Math.round(s.length * 6.8) + 20;

/**
 * GET /api/badge/:symbol — README badge, shields-style.
 * Good scores get embedded proudly; every embed links the assay back to us.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const entry = await getEntryBySymbol(symbol);

  const label = "fineness";
  const value = entry ? `${entry.total}/100` : "not assayed";
  const color = entry ? GRADE(entry.total) : "#5D6960";
  const lw = w(label);
  const vw = w(value);
  const total = lw + vw;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#0A0F0D"/>
    <rect x="${lw}" width="${vw}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${lw / 2}" y="14" fill="#D9B454">${label}</text>
    <text x="${lw + vw / 2}" y="14" font-weight="bold">${value}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}
