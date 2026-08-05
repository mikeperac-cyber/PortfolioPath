type RateBucket = { count: number; resetAt: number };

declare global {
  // This is deliberately process-local. It provides a safe baseline in local
  // development and a single Vercel instance; production scale should attach
  // this interface to a shared edge-rate-limit provider.
  var __portfoliopathRateBuckets: Map<string, RateBucket> | undefined;
}

function store() {
  globalThis.__portfoliopathRateBuckets ??= new Map<string, RateBucket>();
  return globalThis.__portfoliopathRateBuckets;
}

function requestFingerprint(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  maxRequests: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${scope}:${requestFingerprint(request)}`;
  const buckets = store();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= maxRequests)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
