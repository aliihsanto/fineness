import { NextResponse } from "next/server";
import { getStats } from "../../../lib/data";

export const revalidate = 300;

/** Public, no-auth stats endpoint. Bots, X accounts and other dashboards consume this. */
export async function GET() {
  const stats = await getStats();
  return NextResponse.json(
    {
      product: "fineness",
      description: "GitHub reality check for tokenized repos",
      ...stats,
      docs: "/methodology",
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
