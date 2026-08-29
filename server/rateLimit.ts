/**
 * Simple in-memory rate limiter for the dev middleware.
 *
 * Limits by IP (or X-Forwarded-For if behind a proxy). Suitable for
 * the dev server — for production use Vercel's built-in rate limiting
 * or Upstash Ratelimit (Redis-backed, distributed).
 *
 * Strategy: token bucket per IP. Refills at `refillPerMinute` tokens
 * per minute, up to a `bucketSize` cap. Each request consumes 1 token.
 *
 * Returns:
 *   { allowed: true }                  — request is allowed
 *   { allowed: false, retryAfter: s }  — too many requests, retry in `s` sec
 */
interface Bucket {
  tokens: number
  lastRefill: number  // ms
}

const buckets = new Map<string, Bucket>()

interface RateLimitOptions {
  /** Identifier (usually IP). */
  key: string
  /** Max tokens in the bucket. */
  bucketSize: number
  /** Tokens added per minute. */
  refillPerMinute: number
}

// In test mode (NODE_ENV=test), rate limiting is disabled so e2e tests
// don't get blocked when they create multiple accounts in a row.
const IS_TEST = process.env.NODE_ENV === 'test' || !!process.env.PLAYWRIGHT

export function rateLimit(opts: RateLimitOptions): { allowed: boolean; retryAfter: number } {
  if (IS_TEST) {
    // Skip rate limiting in tests — they need to create many users per second
    return { allowed: true, retryAfter: 0 }
  }

  const now = Date.now()
  let bucket = buckets.get(opts.key)
  if (!bucket) {
    bucket = { tokens: opts.bucketSize, lastRefill: now }
    buckets.set(opts.key, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsedMin = (now - bucket.lastRefill) / 60000
  const refilled = elapsedMin * opts.refillPerMinute
  bucket.tokens = Math.min(opts.bucketSize, bucket.tokens + refilled)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, retryAfter: 0 }
  }

  // Compute time until 1 token is available
  const tokensNeeded = 1 - bucket.tokens
  const minutesNeeded = tokensNeeded / opts.refillPerMinute
  return { allowed: false, retryAfter: Math.ceil(minutesNeeded * 60) }
}

/**
 * Extract the client IP from a request. Behind a proxy, prefer
 * X-Forwarded-For (the first IP is the original client).
 */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const xff = req.headers['x-forwarded-for']
  if (Array.isArray(xff) && xff.length > 0) return xff[0]
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim()
  // Fallback: socket IP — but we don't have access to it in the middleware
  // signature we use, so 'unknown' is fine for dev.
  return 'unknown'
}

/**
 * Periodically clean up stale buckets to avoid memory leaks.
 * Called automatically every 5 minutes.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000  // 30 min
    for (const [key, bucket] of buckets) {
      if (bucket.lastRefill < cutoff) {
        buckets.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}
