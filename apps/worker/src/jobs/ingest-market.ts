import { eq } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import { fetchTokenQuote } from "@fineness/market";

export async function ingestMarket(payload: { tokenId: number }) {
  const db = createDb();
  const token = await db.query.tokens.findFirst({ where: eq(schema.tokens.id, payload.tokenId) });
  if (!token) throw new Error(`token ${payload.tokenId} not found`);

  const quote = await fetchTokenQuote(token.chain, token.mintAddress);
  if (!quote) {
    console.warn(`[ingest-market] no pairs for ${token.symbol} (${token.mintAddress})`);
    return null;
  }

  await db.insert(schema.marketSnapshots).values({
    tokenId: token.id,
    price: quote.priceUsd,
    fdv: quote.fdv,
    mcap: quote.mcap,
    volume24h: quote.volume24h,
    liquidity: quote.liquidity,
  });

  return quote.fdv;
}
