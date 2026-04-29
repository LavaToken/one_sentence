/**
 * Simple in-memory IP-based rate limiter.
 *
 * Suitable for a single-instance Vercel deployment. For multi-instance setups,
 * replace with a Redis-backed solution (e.g. @upstash/ratelimit).
 *
 * Map keys are `{key}:{ip}` so different endpoints share the same store
 * without colliding.
 */

interface Record {
  count: number;
  resetAt: number;
}

const store = new Map<string, Record>();

/**
 * Returns true if the request is allowed, false if the rate limit is exceeded.
 *
 * @param ip       The requester's IP address
 * @param key      A string that namespaces this limit (e.g. "checkout")
 * @param max      Maximum requests allowed within the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(
  ip: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const storeKey = `${key}:${ip}`;
  const record = store.get(storeKey);

  if (!record || now > record.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= max) return false;

  record.count += 1;
  return true;
}

/**
 * Extract the best-available IP from a Next.js Request.
 * Falls back to "unknown" so rate-limiting still applies (all unknowns share
 * one bucket, which is intentionally conservative).
 */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
