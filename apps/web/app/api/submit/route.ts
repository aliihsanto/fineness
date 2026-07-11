import { NextResponse } from "next/server";

/** Community token↔repo mapping submissions. Reviewed before going live. */
export async function POST(req: Request) {
  let body: { mintAddress?: string; repoUrl?: string; submittedBy?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { mintAddress, repoUrl, submittedBy } = body;
  if (!mintAddress || !repoUrl || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(repoUrl)) {
    return NextResponse.json(
      { error: "mintAddress and a valid github.com repoUrl are required" },
      { status: 400 },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: "accepted (demo mode — not persisted)" }, { status: 202 });
  }

  const { createDb, schema } = await import("@fineness/db");
  const db = createDb();
  await db.insert(schema.submissions).values({
    mintAddress,
    repoUrl,
    submittedBy: submittedBy ?? null,
  });

  return NextResponse.json({ status: "pending review" }, { status: 201 });
}
