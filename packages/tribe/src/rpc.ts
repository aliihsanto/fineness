/** Minimal Solana JSON-RPC client — no SDK needed for what we read. */
export class SolanaRpc {
  constructor(private url = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com") {}

  async call<T>(method: string, params: unknown[]): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (res.status === 429 && attempt < 5) {
        // public RPC rate limit — back off and retry
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`RPC ${method} ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { result?: T; error?: { code: number; message: string } };
      if (body.error) throw new Error(`RPC ${method} error ${body.error.code}: ${body.error.message}`);
      return body.result as T;
    }
  }
}
