export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimiter = {
  check(key: string, cost?: number): RateLimitDecision;
  reset?(key?: string): void;
};

export type TokenBucketOptions = {
  capacity?: number;
  refillPerSecond?: number;
  now?: () => number;
};

type Bucket = { tokens: number; updatedAt: number };

/** Small dependency-free token bucket. Replaceable with Redis/distributed storage later. */
export class TokenBucketRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private readonly now: () => number;

  constructor(options: TokenBucketOptions = {}) {
    this.capacity = Number.isFinite(options.capacity) && (options.capacity ?? 0) > 0 ? options.capacity! : 60;
    this.refillPerSecond = Number.isFinite(options.refillPerSecond) && (options.refillPerSecond ?? 0) > 0 ? options.refillPerSecond! : 1;
    this.now = options.now ?? (() => Date.now());
  }

  check(key: string, cost = 1): RateLimitDecision {
    const safeCost = Number.isFinite(cost) && cost > 0 ? cost : 1;
    const now = this.now();
    const existing = this.buckets.get(key);
    const elapsedSeconds = existing ? Math.max(0, (now - existing.updatedAt) / 1000) : 0;
    const tokens = Math.min(this.capacity, (existing?.tokens ?? this.capacity) + elapsedSeconds * this.refillPerSecond);
    if (tokens >= safeCost) {
      const remaining = tokens - safeCost;
      this.buckets.set(key, { tokens: remaining, updatedAt: now });
      return { allowed: true, remaining: Math.floor(remaining), retryAfterSeconds: 0 };
    }
    const retryAfterSeconds = Math.max(1, Math.ceil((safeCost - tokens) / this.refillPerSecond));
    this.buckets.set(key, { tokens, updatedAt: now });
    return { allowed: false, remaining: Math.floor(tokens), retryAfterSeconds };
  }

  reset(key?: string): void {
    if (key === undefined) this.buckets.clear();
    else this.buckets.delete(key);
  }
}
