import { NextRequest, NextResponse } from "next/server";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() ?? realIp ?? "unknown-client";
}

export function getRateLimitKey(request: NextRequest, scope: string, userId?: string) {
  return `${scope}:${userId ?? getClientIdentifier(request)}`;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitConfig) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const nextEntry = { count: 1, resetAt: now + windowMs };
    buckets.set(key, nextEntry);

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  current.count += 1;

  return {
    allowed: current.count <= limit,
    limit,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function rateLimitedResponse(resetAt: number) {
  const retryAfterSeconds = Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1);

  return NextResponse.json(
    {
      status: "error",
      message: "Too many requests. Please wait a moment and try again.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
