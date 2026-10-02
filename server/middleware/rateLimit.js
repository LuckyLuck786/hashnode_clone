import httpError from '../utils/httpError.js';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

// key -> { count, resetAt }. Module-level so every limiter instance shares one store
// and tests can reset it between cases.
const hits = new Map();

export function resetRateLimits() {
  hits.clear();
}

// Reads the caller IP from the header Vercel and other proxies set behind their CDN.
function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately dependency-free and per-instance: it protects a single deploy against
 * password guessing, which is what the login endpoint needs. It is not a distributed
 * limit — behind several instances each keeps its own window — so anything stricter
 * should move to a shared store such as Redis.
 */
export function rateLimit({ windowMs = DEFAULT_WINDOW_MS, max = 10, message } = {}) {
  return function rateLimiter(req, res, next) {
    const key = `${req.baseUrl}${req.path}:${clientKey(req)}`;
    const now = Date.now();

    // Drop expired entries so the map cannot grow without bound.
    for (const [entryKey, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(entryKey);
    }

    const entry = hits.get(key);

    if (!entry) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', String(max - 1));
      return next();
    }

    entry.count += 1;

    const secondsLeft = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(secondsLeft));
      throw httpError(
        429,
        message ?? `Too many attempts. Try again in ${Math.max(1, Math.ceil(secondsLeft / 60))} minute(s).`,
      );
    }

    next();
  };
}