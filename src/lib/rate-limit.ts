import "server-only";

/**
 * Fixed-window rate limiter (section 57).
 *
 * Backed by a module-level Map, which is per-process: on serverless this caps
 * abuse per instance rather than globally, which is still useful (it raises the
 * cost of scripted abuse) but is not a substitute for a shared store like Redis
 * or Upstash once traffic is real. `RATE_LIMIT_REDIS_URL` is where you would
 * swap in that store — the interface below is already async and keyed.
 *
 * Chosen over a dependency because the behaviour needed is small and the
 * trade-off should be visible in the code rather than hidden in a library.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory: at most 10k distinct keys before the oldest are swept.
const MAX_KEYS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap in case everything is live.
  if (buckets.size >= MAX_KEYS) {
    const entries = [...buckets.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    for (const [key] of entries.slice(0, MAX_KEYS / 2)) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets; useful for a Retry-After header. */
  retryAfter: number;
}

/**
 * @param key      Identifier to rate limit on, e.g. `lead:${cardId}:${ip}`.
 * @param limit    Allowed requests per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
}

/** Clears a key, called after a successful submission so users are not punished. */
export function resetLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP.
 *
 * Only used as a *hash salt for rate limiting*, never stored: `analytics_events`
 * and `leads` hold no raw IP (sections 25 and 61).
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Coarse device bucket. No fingerprinting, no user-agent persistence. */
export function deviceCategory(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android|blackberry|opera mini/i.test(userAgent)) return "mobile";
  return "desktop";
}