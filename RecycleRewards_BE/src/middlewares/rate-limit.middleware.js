const buckets = new Map();

// Process-local rate limit. It is enough for the one PM2 process deployed here;
// for multiple servers use Redis or another shared rate-limit store.
export function rateLimit({ windowMs, max, key = (req) => req.ip, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = String(key(req) || 'anonymous');
    const recent = (buckets.get(bucketKey) || []).filter((timestamp) => timestamp > now - windowMs);
    if (recent.length >= max) {
      res.set('Retry-After', String(Math.ceil((recent[0] + windowMs - now) / 1000)));
      return res.status(429).json({ message });
    }
    recent.push(now);
    buckets.set(bucketKey, recent);
    next();
  };
}
