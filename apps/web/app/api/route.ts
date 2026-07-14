import { NextResponse } from "next/server";
import { API_CORS } from "../../lib/public-api";

/** GET /api — endpoint index, so the API root is self-describing. */
export async function GET() {
  return NextResponse.json(
    {
      product: "fineness",
      description: "GitHub reality check for tokenized repos",
      docs: "/docs",
      endpoints: {
        "GET /api/stats": "ledger-wide aggregates (repos assayed, median score, flag rates)",
        "GET /api/leaderboard": "full ledger — ?platform=tribe|other &sort=gap|fineness|fdv|volume &flag=FORK &limit=100",
        "GET /api/token/{symbol}": "full assay report for one token, incl. raw scoring signals",
        "GET /api/score/{owner}/{repo}": "assay report looked up by GitHub repo",
        "GET /api/badge/{symbol}": "SVG score badge for READMEs — embed it, link the assay",
        "POST /api/submit": "submit a token↔repo mapping or dispute an existing one",
      },
      auth: "none — public, CORS-open, be gentle",
    },
    { headers: API_CORS },
  );
}
