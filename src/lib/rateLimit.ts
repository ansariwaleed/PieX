import { NextResponse } from 'next/server'

interface RateLimitStore {
  count: number
  resetTime: number
}

// Global in-memory storage across requests in the same serverless instance
const memoryStore = new Map<string, RateLimitStore>()

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key)
    }
  }
}

export interface RateLimitOptions {
  limit: number          // Max number of requests allowed in window
  windowSeconds: number  // Time window in seconds
  identifier?: string    // Optional custom identifier (defaults to client IP)
}

/**
 * Extract client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  )
}

/**
 * Enforce rate limiting on an incoming API route request.
 * Returns null if request is within limits, or a 429 NextResponse if rate limit is exceeded.
 */
export function enforceRateLimit(
  request: Request,
  routeKey: string,
  options: RateLimitOptions
): NextResponse | null {
  cleanupExpired()

  const ip = options.identifier || getClientIp(request)
  const key = `${routeKey}:${ip}`
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000

  let record = memoryStore.get(key)

  if (!record || now > record.resetTime) {
    // Start a new window
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    memoryStore.set(key, record)
    return null
  }

  record.count += 1

  const remaining = Math.max(0, options.limit - record.count)
  const retryAfter = Math.ceil((record.resetTime - now) / 1000)

  if (record.count > options.limit) {
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000))
        }
      }
    )
  }

  return null
}
