/**
 * DefiLlama discovery: free, keyless, one request. /protocols carries ~850
 * entries with BOTH a token address and a GitHub org — the established-token
 * backbone CoinGecko keeps 429ing us out of.
 */
export type LlamaProtocol = {
  name: string;
  symbol: string;
  chain: string; // dexscreener chainId
  address: string;
  githubOrg: string;
  tvl: number;
};

// llama address prefix → dexscreener chainId (bare 0x… addresses are ethereum)
const CHAIN_MAP: Record<string, string> = {
  ethereum: "ethereum",
  solana: "solana",
  bsc: "bsc",
  binance: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  avax: "avalanche",
  avalanche: "avalanche",
  base: "base",
  fantom: "fantom",
  sui: "sui",
  aptos: "aptos",
  tron: "tron",
  ton: "ton",
  berachain: "berachain",
  sonic: "sonic",
  blast: "blast",
  scroll: "scroll",
  linea: "linea",
  mantle: "mantle",
  hyperliquid: "hyperevm",
};

export async function fetchLlamaProtocols(): Promise<LlamaProtocol[]> {
  const res = await fetch("https://api.llama.fi/protocols", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`defillama /protocols ${res.status}`);
  const raw = (await res.json()) as any[];

  const out: LlamaProtocol[] = [];
  for (const p of raw) {
    const org: string | undefined = Array.isArray(p.github) ? p.github.find(Boolean) : undefined;
    const addr: string | undefined = typeof p.address === "string" ? p.address : undefined;
    if (!org || !addr || addr === "-" || !p.symbol || p.symbol === "-") continue;

    let chain = "ethereum";
    let address = addr;
    const sep = addr.indexOf(":");
    if (sep > 0) {
      const mapped = CHAIN_MAP[addr.slice(0, sep).toLowerCase()];
      if (!mapped) continue; // chain we can't quote
      chain = mapped;
      address = addr.slice(sep + 1);
    }
    if (!address) continue;

    out.push({
      name: p.name,
      symbol: String(p.symbol).toUpperCase(),
      chain,
      address,
      githubOrg: org,
      tvl: typeof p.tvl === "number" ? p.tvl : 0,
    });
  }
  return out.sort((a, b) => b.tvl - a.tvl);
}
