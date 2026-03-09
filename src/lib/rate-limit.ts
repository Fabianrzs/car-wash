/**
 * In-memory rate limiter for API routes.
 *
 * NOTE: In a distributed/serverless environment (e.g. Vercel with multiple instances),
 * this only limits within a single instance. For production at scale, replace the
 * `store` Map with Upstash Redis or Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global store — persists across requests within the same Node.js process
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (e.g. IP address or email).
 * Returns whether the request is allowed and how many attempts remain.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // First request in window or window expired
    const entry: RateLimitEntry = { count: 1, resetAt: now + options.windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;

  if (existing.count > options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Get the client IP from a Request, checking common proxy headers first.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
