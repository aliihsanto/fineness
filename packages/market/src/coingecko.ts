/**
 * CoinGecko discovery: AI-category coins carry a GitHub repo link in their
 * metadata — a steady source of token↔repo mappings beyond launchpads.
 * Free API, no key: ~10 req/min, so calls are throttled and retried on 429.
 */
export type DiscoveredCoin = {
  id: string;
  symbol: string;
  name: string;
  fdv: number | null;
  github: { owner: string; name: string } | null;
  /** chain → contract address, only chains we can quote on DexScreener */
  contracts: Record<string, string>;
};

const BASE = "https://api.coingecko.com/api/v3";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// coingecko platform id → dexscreener chainId
const CHAIN_MAP: Record<string, string> = {
  solana: "solana",
  ethereum: "ethereum",
  base: "base",
  "binance-smart-chain": "bsc",
  "arbitrum-one": "arbitrum",
  "polygon-pos": "polygon",
};

async function cg<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
    if (res.status === 429 && attempt < 5) {
      await sleep(20_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`coingecko ${path} ${res.status}`);
    return (await res.json()) as T;
  }
}

export function extractGithubRepo(url: string): { owner: string; name: string } | null {
  const m = /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i.exec(url);
  if (!m) return null;
  if (m[2] === undefined || m[1] === undefined) return null;
  return { owner: m[1], name: m[2] };
}

/** top coins of a category, hydrated with repo link + contract addresses */
export async function discoverCategory(
  category: string,
  limit = 30,
  throttleMs = 15_000,
): Promise<DiscoveredCoin[]> {
  const markets = await cg<{ id: string; symbol: string; name: string; fully_diluted_valuation: number | null }[]>(
    `/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&per_page=${limit}&page=1`,
  );

  const out: DiscoveredCoin[] = [];
  for (const m of markets) {
    await sleep(throttleMs);
    let detail: any;
    try {
      detail = await cg<any>(
        `/coins/${m.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      );
    } catch (err) {
      console.warn(`[coingecko] detail failed for ${m.id}:`, (err as Error).message);
      continue;
    }

    const ghUrl: string | undefined = (detail.links?.repos_url?.github ?? []).find(Boolean);
    const contracts: Record<string, string> = {};
    for (const [platform, addr] of Object.entries(detail.platforms ?? {})) {
      const chain = CHAIN_MAP[platform];
      if (chain && typeof addr === "string" && addr) contracts[chain] = addr;
    }

    out.push({
      id: m.id,
      symbol: m.symbol.toUpperCase(),
      name: m.name,
      fdv: m.fully_diluted_valuation,
      github: ghUrl ? extractGithubRepo(ghUrl) : null,
      contracts,
    });
  }
  return out;
}

/** DexScreener latest token profiles + boosts — catches fresh tokens whose profile links a repo */
export async function discoverDexProfiles(): Promise<
  { chain: string; address: string; github: { owner: string; name: string } }[]
> {
  const urls = [
    "https://api.dexscreener.com/token-profiles/latest/v1",
    "https://api.dexscreener.com/token-boosts/latest/v1",
  ];
  const found = new Map<string, { chain: string; address: string; github: { owner: string; name: string } }>();
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) continue;
      const items = (await res.json()) as any[];
      for (const item of items ?? []) {
        const link = (item.links ?? []).find((l: any) => /github\.com/i.test(l?.url ?? ""));
        if (!link) continue;
        const gh = extractGithubRepo(link.url);
        if (!gh || !item.chainId || !item.tokenAddress) continue;
        found.set(`${item.chainId}:${item.tokenAddress}`, {
          chain: item.chainId,
          address: item.tokenAddress,
          github: gh,
        });
      }
    } catch {
      // best-effort source; next sweep retries
    }
  }
  return [...found.values()];
}
