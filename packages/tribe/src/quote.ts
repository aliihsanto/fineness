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

export async function fetchTribeTrades(
  rpc: SolanaRpc,
  mint: string,
  opts: { limit?: number; throttleMs?: number } = {},
): Promise<TribeTrade[]> {
  // transferChecked references the mint account, so swap txs are indexed on it
  const sigs = await rpc.call<{ signature: string; err: unknown; blockTime: number | null }[]>(
    "getSignaturesForAddress",
    [mint, { limit: opts.limit ?? 15 }],
  );

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
  const trades = await fetchTribeTrades(rpc, mint);
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
