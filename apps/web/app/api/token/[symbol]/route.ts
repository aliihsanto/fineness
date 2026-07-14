import { NextResponse } from "next/server";
import { getEntryBySymbol } from "../../../../lib/data";
import { API_CORS, toPublicDetail } from "../../../../lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/token/:symbol — full assay report incl. the raw signals the score was computed from. */
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const entry = await getEntryBySymbol(symbol);
  if (!entry) {
    return NextResponse.json(
      { error: "token not assayed yet", submit: "/api/submit" },
      { status: 404, headers: API_CORS },
    );
  }
  return NextResponse.json(toPublicDetail(entry), { headers: API_CORS });
}
