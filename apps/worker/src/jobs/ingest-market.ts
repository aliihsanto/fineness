import { eq } from "drizzle-orm";
import { createDb, schema } from "@fineness/db";
import { fetchTokenQuote } from "@fineness/market";
import { SolanaRpc, fetchTribeQuote } from "@fineness/tribe";

const WSOL = "So11111111111111111111111111111111111111112";

export async function ingestMarket(payload: { tokenId: number }) {
  const db = createDb();
  const token = await db.query.tokens.findFirst({ where: eq(schema.tokens.id, payload.tokenId) });
  if (!token) throw new Error(`token ${payload.tokenId} not found`);

  const quote = await fetchTokenQuote(token.chain, token.mintAddress);
  if (quote) {
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

  // bonding-curve tokens (tribe) have no DEX pair — price them from executed
  // on-chain swaps instead: |ΔSOL| / |Δtokens| of the latest trade
  if (token.platform === "tribe" && token.chain === "solana") {
    const sol = await fetchTokenQuote("solana", WSOL).catch(() => null);
    const curve = await fetchTribeQuote(new SolanaRpc(), token.mintAddress, sol?.priceUsd ?? null);
    if (curve) {
      await db.insert(schema.marketSnapshots).values({
        tokenId: token.id,
        price: curve.priceUsd,
        fdv: curve.fdv,
        mcap: null,
        volume24h: curve.volume24hUsd,
        liquidity: null,
      });
      console.log(
        `[ingest-market] ${token.symbol}: curve price ${curve.priceSol.toExponential(3)} SOL, FDV ${
          curve.fdv === null ? "n/a" : `$${Math.round(curve.fdv).toLocaleString("en-US")}`
        } (${curve.trades} trades)`,
      );
      return curve.fdv;
    }
  }

  console.warn(`[ingest-market] no pairs for ${token.symbol} (${token.mintAddress})`);
  return null;
}
