import { NextResponse } from "next/server";
import { getEntryByRepo } from "../../../../../lib/data";
import { API_CORS, toPublicDetail } from "../../../../../lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> },
) {
  const { owner, repo } = await params;
  const entry = await getEntryByRepo(owner, repo);
  if (!entry) {
    return NextResponse.json(
      { error: "repo not scanned yet", submit: "/api/submit" },
      { status: 404, headers: API_CORS },
    );
  }
  return NextResponse.json(toPublicDetail(entry), { headers: API_CORS });
}
