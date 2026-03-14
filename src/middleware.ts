import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  return ip
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimit.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimit.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimit.delete(key)
    }
  })
}, 60000)

export function middleware(request: NextRequest) {
  // Only rate-limit API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const key = getRateLimitKey(request)
  const isExecute = request.nextUrl.pathname.startsWith("/api/execute")

  // Execute endpoint: 10 req/min; other API: 60 req/min
  const limit = isExecute ? 10 : 60
  const windowMs = 60_000

  const rateLimitKey = `${key}:${isExecute ? "execute" : "api"}`

  if (!checkRateLimit(rateLimitKey, limit, windowMs)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
