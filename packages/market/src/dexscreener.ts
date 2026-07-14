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

  // price/fdv come from the deepest pool, but volume and liquidity are summed
  // across every pool where this token is the base — one-pair numbers wildly
  // undercount tokens that trade on several DEXes/chains
  const mine = pairs.filter((p) => p?.baseToken?.address?.toLowerCase() === mintAddress.toLowerCase());
  const pool = mine.length > 0 ? mine : pairs;
  const best = pool.slice().sort((a, b) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0))[0];
  const volume24h = pool.reduce((s, p) => s + (p?.volume?.h24 ?? 0), 0);
  const liquidity = pool.reduce((s, p) => s + (p?.liquidity?.usd ?? 0), 0);

  return {
    priceUsd: best.priceUsd ? Number(best.priceUsd) : null,
    fdv: best.fdv ?? null,
    mcap: best.marketCap ?? null,
    volume24h: volume24h > 0 ? volume24h : null,
    liquidity: liquidity > 0 ? liquidity : null,
    pairAddress: best.pairAddress ?? null,
    baseSymbol: best.baseToken?.symbol ?? null,
    baseName: best.baseToken?.name ?? null,
  };
}
