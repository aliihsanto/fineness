type TokenState = {
  token: string;
  remaining: number;
  resetAt: number; // epoch ms
};

/**
 * Rotates 1-4 GitHub PATs. A token that reports remaining < threshold is
 * benched until its resetAt. pick() returns the token with the most quota left.
 */
export class TokenPool {
  private states: TokenState[];

  constructor(tokens: string[], private minRemaining = 50) {
    const list = tokens.map((t) => t.trim()).filter(Boolean);
    if (list.length === 0) throw new Error("TokenPool needs at least one GitHub token (GITHUB_TOKENS)");
    this.states = list.map((token) => ({ token, remaining: 5000, resetAt: 0 }));
  }

  static fromEnv(env = process.env.GITHUB_TOKENS ?? ""): TokenPool {
    return new TokenPool(env.split(","));
  }

  pick(now = Date.now()): string {
    const usable = this.states.filter((s) => s.remaining >= this.minRemaining || s.resetAt <= now);
    if (usable.length === 0) {
      const soonest = Math.min(...this.states.map((s) => s.resetAt));
      throw new RateLimitedError(soonest);
    }
    usable.sort((a, b) => b.remaining - a.remaining);
    return usable[0]!.token;
  }

  /** feed back the rateLimit block from a GraphQL response */
  report(token: string, remaining: number, resetAt: string | number): void {
    const s = this.states.find((x) => x.token === token);
    if (!s) return;
    s.remaining = remaining;
    s.resetAt = typeof resetAt === "number" ? resetAt : Date.parse(resetAt);
  }

  get size(): number {
    return this.states.length;
  }
}

export class RateLimitedError extends Error {
  constructor(public readonly resetAtMs: number) {
    super(`All GitHub tokens exhausted; earliest reset at ${new Date(resetAtMs).toISOString()}`);
    this.name = "RateLimitedError";
  }
}
