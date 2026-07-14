import { NextResponse } from "next/server";
import { getStats } from "../../../lib/data";

// always live — a cheap query, and bots/dashboards expect fresh numbers
export const dynamic = "force-dynamic";

/** Public, no-auth stats endpoint. Bots, X accounts and other dashboards consume this. */
export async function GET() {
  const stats = await getStats();
  return NextResponse.json(
    {
      product: "fineness",
      description: "GitHub reality check for tokenized repos",
      ...stats,
      docs: "/docs",
      endpoints: "/api",
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
