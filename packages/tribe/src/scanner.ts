import { SolanaRpc } from "./rpc";

/** Tribe launchpad program — emits "Instruction: CreateToken" for each launch. */
export const TRIBE_PROGRAM_ID = "B1x53qgNmAdZMfPVZvu89qDmNn3RpdKajRFXqCzE7UPU";

export type TribeLaunch = {
  signature: string;
  blockTime: Date | null;
  mint: string;
};

export type TribeTokenMeta = {
  mint: string;
  name: string | null;
  symbol: string | null;
  uri: string | null;
  description: string | null;
  website: string | null;
  createdOn: string | null;
  /** owner/name extracted from a github.com website link, if any */
  githubRepo: { owner: string; name: string } | null;
};

export type SignatureInfo = { signature: string; err: unknown; blockTime: number | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pages of program signatures, newest first. `until` bounds sweeps (only new
 * signatures), `before` resumes deep backfills. Stops when the chain runs out.
 */
export async function* iterateSignatures(
  rpc: SolanaRpc,
  opts: { until?: string; before?: string; pageSize?: number } = {},
): AsyncGenerator<SignatureInfo[]> {
  let before = opts.before;
  for (;;) {
    const sigs = await rpc.call<SignatureInfo[]>("getSignaturesForAddress", [
      TRIBE_PROGRAM_ID,
      {
        limit: opts.pageSize ?? 1000,
        ...(before ? { before } : {}),
        ...(opts.until ? { until: opts.until } : {}),
      },
    ]);
    if (sigs.length === 0) return;
    yield sigs;
    before = sigs[sigs.length - 1]!.signature;
  }
}

/** returns the launch if this signature is a successful CreateToken, else null */
export async function parseCreateTokenTx(rpc: SolanaRpc, signature: string): Promise<TribeLaunch | null> {
  const tx = await rpc.call<any>("getTransaction", [
    signature,
    { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
  ]);
  if (!tx?.meta?.logMessages?.some((l: string) => l.includes("Instruction: CreateToken"))) return null;

  // the new mint is the initializeMint2 target inside the CreateToken CPI
  const inner = (tx.meta.innerInstructions ?? [])
    .flatMap((g: any) => g.instructions ?? [])
    .find((ix: any) => ix?.parsed?.type === "initializeMint2");
  const mint = inner?.parsed?.info?.mint;
  if (!mint) return null;

  return {
    signature,
    blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
    mint,
  };
}

/**
 * Recent CreateToken launches from the Tribe program.
 * `until`: stop at this signature (exclusive) — pass the newest already-processed
 * signature so repeat sweeps only return new launches.
 */
export async function fetchRecentLaunches(
  rpc: SolanaRpc,
  opts: { limit?: number; until?: string; throttleMs?: number } = {},
): Promise<{ launches: TribeLaunch[]; newestSignature: string | null }> {
  const launches: TribeLaunch[] = [];
  let newestSignature: string | null = null;
  let remaining = opts.limit ?? 1000;

  for await (const page of iterateSignatures(rpc, { until: opts.until, pageSize: Math.min(remaining, 1000) })) {
    newestSignature ??= page[0]?.signature ?? null;
    for (const sig of page) {
      if (sig.err) continue;
      const launch = await parseCreateTokenTx(rpc, sig.signature);
      if (launch) launches.push(launch);
      if (opts.throttleMs) await sleep(opts.throttleMs);
    }
    remaining -= page.length;
    if (remaining <= 0) break;
  }
  return { launches, newestSignature };
}

/**
 * Token-2022 launches carry their metadata in the mint account itself
 * (TokenMetadata extension); the URI JSON holds description/website/createdOn.
 */
export async function fetchTokenMeta(rpc: SolanaRpc, mint: string): Promise<TribeTokenMeta> {
  const acc = await rpc.call<any>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  const ext = acc?.value?.data?.parsed?.info?.extensions?.find(
    (e: any) => e.extension === "tokenMetadata",
  );
  const state = ext?.state ?? {};
  const meta: TribeTokenMeta = {
    mint,
    name: state.name ?? null,
    symbol: state.symbol ?? null,
    uri: state.uri ?? null,
    description: null,
    website: null,
    createdOn: null,
    githubRepo: null,
  };

  if (meta.uri) {
    try {
      const res = await fetch(meta.uri, { headers: { accept: "application/json" } });
      if (res.ok) {
        const json = (await res.json()) as Record<string, unknown>;
        meta.description = typeof json.description === "string" ? json.description : null;
        meta.website = typeof json.website === "string" ? json.website : null;
        meta.createdOn = typeof json.createdOn === "string" ? json.createdOn : null;
      }
    } catch {
      // IPFS gateways flake; metadata stays partial
    }
  }

  if (meta.website) meta.githubRepo = extractGithubRepo(meta.website);
  return meta;
}

export function extractGithubRepo(url: string): { owner: string; name: string } | null {
  const m = /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i.exec(url);
  if (!m) return null;
  return { owner: m[1]!, name: m[2]! };
}
