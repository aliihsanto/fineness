import { NextResponse } from "next/server";
import { getLeaderboard, type SortKey } from "../../../lib/data";
import { API_CORS, toPublicEntry } from "../../../lib/public-api";

export const dynamic = "force-dynamic";

const SORTS: SortKey[] = ["gap", "fineness", "fdv", "volume"];

/**
 * GET /api/leaderboard — the full assay ledger.
 * ?platform=tribe|other  ?sort=gap|fineness|fdv|volume  ?limit=1..500  ?flag=FORK|AI_SLOP|...
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sortParam = url.searchParams.get("sort") as SortKey | null;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "gap";
  const platform = url.searchParams.get("platform");
  const flag = url.searchParams.get("flag")?.toUpperCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  let entries = await getLeaderboard(sort);
  if (platform === "tribe") entries = entries.filter((e) => e.platform === "tribe");
  else if (platform === "other") entries = entries.filter((e) => e.platform !== "tribe");
  if (flag) entries = entries.filter((e) => e.flags.includes(flag));

  return NextResponse.json(
    {
      count: Math.min(entries.length, limit),
      total: entries.length,
      sort,
      generatedAt: new Date().toISOString(),
      items: entries.slice(0, limit).map(toPublicEntry),
    },
    { headers: API_CORS },
  );
}
