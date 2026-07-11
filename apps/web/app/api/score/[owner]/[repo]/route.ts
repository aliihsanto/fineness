import { NextResponse } from "next/server";
import { getEntryByRepo } from "../../../../../lib/data";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> },
) {
  const { owner, repo } = await params;
  const entry = await getEntryByRepo(owner, repo);
  if (!entry) {
    return NextResponse.json({ error: "repo not scanned yet", submit: "/api/submit" }, { status: 404 });
  }
  return NextResponse.json(entry, { headers: { "access-control-allow-origin": "*" } });
}
