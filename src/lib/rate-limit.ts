/**
 * Simple in-memory rate limiter.
 * For multi-instance / production at scale, replace with @upstash/ratelimit + Redis.
 *
 * Usage:
 *   const allowed = rateLimit(ip, "auth", 5, 60_000);  // 5 req / 60s
 *   if (!allowed) return errorResponse("Too many requests", 429);
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically clean up expired buckets to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 60_000);

/**
 * @param identifier  Unique key (e.g. IP address or userId)
 * @param namespace   Route namespace to isolate limits (e.g. "auth", "coupon")
 * @param limit       Max requests allowed in window
 * @param windowMs    Window duration in milliseconds
 * @returns true if request is allowed, false if rate-limited
 */
export function rateLimit(
  identifier: string,
  namespace: string,
  limit: number,
  windowMs: number,
): boolean {
  const key = `${namespace}:${identifier}`;
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

/**
 * Extract best-effort IP from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req.headers as Headers).get("x-real-ip") ?? "unknown";
}
