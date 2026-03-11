// In-memory rate limiter for edge functions
// Tracks requests by IP and enforces per-minute limits

const requestLog = new Map<string, number[]>();

/**
 * Check if a request should be rate limited.
 * @param ip Client IP address
 * @param limit Max requests per minute
 * @returns { allowed: boolean, remaining: number, retryAfter: number }
 */
export function checkRateLimit(ip: string, limit: number) {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  if (!requestLog.has(ip)) {
    requestLog.set(ip, []);
  }

  const timestamps = requestLog.get(ip)!;

  // Remove timestamps older than 1 minute
  const recent = timestamps.filter((t) => t > oneMinuteAgo);
  requestLog.set(ip, recent);

  const remaining = Math.max(0, limit - recent.length);
  const allowed = recent.length < limit;

  if (allowed) {
    recent.push(now);
  }

  // Calculate retry-after: when the oldest request expires
  const retryAfter = recent.length > 0 ? Math.ceil((recent[0] + 60000 - now) / 1000) : 0;

  return { allowed, remaining, retryAfter };
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  // Try Cloudflare header first (common for edge functions)
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Fallback to x-forwarded-for (may be comma-separated)
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  // Fallback to x-real-ip
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;

  return "unknown";
}
