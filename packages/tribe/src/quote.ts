import { SolanaRpc } from "./rpc";

/**
 * Tribe tokens live on a bonding curve — no DEX pair, so DexScreener knows
 * nothing about them. Price is derived from executed swaps instead: every
 * SwapWithReferral moves SOL from/to the payer and tokens through the vault,
 * so |ΔSOL| / |Δtokens| of the latest trade IS the market price. Verified
 * against a live curve: consecutive trades price 8.2e-7 → 1.33e-6 SOL as the
 * curve fills.
 */
export type TribeTrade = {
  signature: string;
  blockTime: number | null;
  priceSol: number;
  solMoved: number; // absolute SOL amount of the trade
};

export type TribeQuote = {
  priceSol: number;
  priceUsd: number | null;
  fdv: number | null;
  volume24hUsd: number | null;
  lastTradeAt: Date | null;
  trades: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SigInfo = { signature: string; err: unknown; blockTime: number | null };

/**
 * All non-failed signatures touching the mint since `sinceTs`, paginated —
 * a fixed "last 15" window undercounts 24h volume badly on active tokens.
 * Capped so a viral token can't turn one quote into thousands of RPC calls.
 */
async function signaturesSince(rpc: SolanaRpc, mint: string, sinceTs: number, cap = 150): Promise<SigInfo[]> {
  const out: SigInfo[] = [];
  let before: string | undefined;
  while (out.length < cap) {
    const page = await rpc.call<SigInfo[]>("getSignaturesForAddress", [
      mint,
      { limit: 100, ...(before ? { before } : {}) },
    ]);
    if (page.length === 0) break;
    for (const sig of page) {
      if (sig.blockTime !== null && sig.blockTime < sinceTs) return out;
      if (!sig.err) out.push(sig);
      if (out.length >= cap) return out;
    }
    before = page[page.length - 1]!.signature;
    if (page.length < 100) break;
  }
  return out;
}

export async function fetchTribeTrades(
  rpc: SolanaRpc,
  mint: string,
  opts: { limit?: number; throttleMs?: number; sinceTs?: number } = {},
): Promise<TribeTrade[]> {
  // transferChecked references the mint account, so swap txs are indexed on it
  const sigs =
    opts.sinceTs !== undefined
      ? await signaturesSince(rpc, mint, opts.sinceTs, opts.limit ?? 150)
      : await rpc.call<SigInfo[]>("getSignaturesForAddress", [mint, { limit: opts.limit ?? 15 }]);

  const trades: TribeTrade[] = [];
  for (const sig of sigs) {
    if (sig.err) continue;
    await sleep(opts.throttleMs ?? 300);
    let tx: any;
    try {
      tx = await rpc.call<any>("getTransaction", [
        sig.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);
    } catch {
      continue;
    }
    if (!tx?.meta?.logMessages?.some((l: string) => l.includes("Instruction: Swap"))) continue;

    // tokens received across accounts of this mint
    const pre = new Map<number, bigint>();
    for (const b of tx.meta.preTokenBalances ?? []) {
      if (b.mint === mint) pre.set(b.accountIndex, BigInt(b.uiTokenAmount.amount));
    }
    let tokensMoved = 0n;
    let decimals = 9;
    for (const b of tx.meta.postTokenBalances ?? []) {
      if (b.mint !== mint) continue;
      decimals = b.uiTokenAmount.decimals;
      const d = BigInt(b.uiTokenAmount.amount) - (pre.get(b.accountIndex) ?? 0n);
      if (d > 0n) tokensMoved += d;
    }
    if (tokensMoved === 0n) continue;

    // SOL side: fee payer's balance change, tx fee excluded — works for both
    // buys (delta = -(spent+fee)) and sells (delta = received-fee)
    const payerDelta = tx.meta.postBalances[0] - tx.meta.preBalances[0];
    const solMoved = Math.abs(payerDelta + tx.meta.fee) / 1e9;
    if (solMoved < 0.01) continue; // dust/noise

    const tokens = Number(tokensMoved) / 10 ** decimals;
    trades.push({
      signature: sig.signature,
      blockTime: sig.blockTime,
      priceSol: solMoved / tokens,
      solMoved,
    });
  }
  return trades; // newest first
}

export async function fetchTribeQuote(
  rpc: SolanaRpc,
  mint: string,
  solUsd: number | null,
): Promise<TribeQuote | null> {
  const dayAgoTs = Math.floor(Date.now() / 1000) - 86_400;
  // full 24h window for volume; if the token didn't trade today, fall back to
  // the latest historical trades so price/FDV still resolve
  let trades = await fetchTribeTrades(rpc, mint, { sinceTs: dayAgoTs });
  if (trades.length === 0) trades = await fetchTribeTrades(rpc, mint, { limit: 25 });
  const last = trades[0];
  if (!last) return null;

  let fdv: number | null = null;
  try {
    const supply = await rpc.call<{ value: { amount: string; decimals: number } }>("getTokenSupply", [mint]);
    const total = Number(supply.value.amount) / 10 ** supply.value.decimals;
    if (solUsd !== null) fdv = last.priceSol * solUsd * total;
  } catch {
    // supply lookup is best-effort
  }

  const dayAgo = Date.now() / 1000 - 86_400;
  const vol24Sol = trades.filter((t) => (t.blockTime ?? 0) >= dayAgo).reduce((s, t) => s + t.solMoved, 0);

  return {
    priceSol: last.priceSol,
    priceUsd: solUsd === null ? null : last.priceSol * solUsd,
    fdv,
    volume24hUsd: solUsd === null ? null : vol24Sol * solUsd,
    lastTradeAt: last.blockTime ? new Date(last.blockTime * 1000) : null,
    trades: trades.length,
  };
}
