import { and, eq } from "drizzle-orm";
import { schema, type Db } from "@fineness/db";
import { ingestGithub } from "./ingest-github";
import { ingestMarket } from "./ingest-market";
import { computeScore } from "./compute-score";

/**
 * Generic auto-mapping: token contract + repo → full pipeline
 * (repo scan → token row → live quote → score). Idempotent by chain+address.
 * Returns true when a new token row was created.
 */
export async function autoMap(
  db: Db,
  args: {
    chain: string;
    address: string;
    symbol: string;
    name: string | null;
    repoOwner: string;
    repoName: string;
    platform: string;
    source: string;
  },
): Promise<boolean> {
  const existing = await db.query.tokens.findFirst({
    where: and(eq(schema.tokens.chain, args.chain), eq(schema.tokens.mintAddress, args.address)),
  });
  if (existing) return false;

  let repoId: number | null = null;
  try {
    repoId = await ingestGithub({ owner: args.repoOwner, name: args.repoName });
  } catch (err) {
    console.warn(`[discover] repo scan failed for ${args.symbol}:`, (err as Error).message);
  }
  if (!repoId) return false; // no repo, no listing — this product maps tokens to code

  const [token] = await db
    .insert(schema.tokens)
    .values({
      chain: args.chain,
      mintAddress: args.address,
      symbol: args.symbol.toUpperCase().slice(0, 40),
      name: args.name,
      platform: args.platform,
      repoId,
      launchedAt: null,
      verified: false,
      verificationSource: args.source,
    })
    .onConflictDoNothing()
    .returning({ id: schema.tokens.id });
  if (!token) return false;

  await ingestMarket({ tokenId: token.id }).catch((err) =>
    console.warn(`[discover] quote failed for ${args.symbol}:`, (err as Error).message),
  );
  await computeScore({ repoId });
  console.log(`[discover] +$${args.symbol.toUpperCase()} → ${args.repoOwner}/${args.repoName} (${args.source})`);
  return true;
}
