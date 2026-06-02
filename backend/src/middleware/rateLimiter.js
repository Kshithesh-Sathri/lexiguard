// Simple in-memory rate limiter (no Redis dependency)
const requestCounts = new Map();

export function rateLimiter(maxRequests = 20, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const key = ip;

    const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

    // Reset window if expired
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    requestCounts.set(key, record);

    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a minute and try again.'
      });
    }

    next();
  };
}
