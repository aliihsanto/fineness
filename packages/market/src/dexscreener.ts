export type MarketQuote = {
  priceUsd: number | null;
  fdv: number | null;
  mcap: number | null;
  volume24h: number | null;
  liquidity: number | null;
  pairAddress: string | null;
  baseSymbol: string | null;
  baseName: string | null;
};

const BASE = "https://api.dexscreener.com";

/**
 * Free, no-auth endpoint. Returns the deepest-liquidity pair for a token mint.
 * https://docs.dexscreener.com/api/reference
 */
export async function fetchTokenQuote(chain: string, mintAddress: string): Promise<MarketQuote | null> {
  const res = await fetch(`${BASE}/tokens/v1/${encodeURIComponent(chain)}/${encodeURIComponent(mintAddress)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`DexScreener ${res.status}: ${await res.text()}`);
  }
  const pairs = (await res.json()) as any[];
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  const best = pairs
    .slice()
    .sort((a, b) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0))[0];

  return {
    priceUsd: best.priceUsd ? Number(best.priceUsd) : null,
    fdv: best.fdv ?? null,
    mcap: best.marketCap ?? null,
    volume24h: best.volume?.h24 ?? null,
    liquidity: best.liquidity?.usd ?? null,
    pairAddress: best.pairAddress ?? null,
    baseSymbol: best.baseToken?.symbol ?? null,
    baseName: best.baseToken?.name ?? null,
  };
}
