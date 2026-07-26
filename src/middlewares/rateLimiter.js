import redisClient from '../config/redis.js';

/**
 * Groq-Safe API Key Rate Limiter
 * Default limit 30 requests/min set ki gayi hai taake Groq Free Tier limits breach na hon.
 */
export const apiKeyRateLimiter = (limitPerMinute = 30) => {
  return async (req, res, next) => {
    
    const keyHash = req.apiKeyMeta?.keyHash || req.ip;

    const currentMinute = Math.floor(Date.now() / 60000);
    const redisRateKey = `ratelimit:${keyHash}:${currentMinute}`;

    try {
      // ⚡ Atomic Execution using Redis Multi Pipeline
      const responses = await redisClient
        .multi()
        .incr(redisRateKey)
        .expire(redisRateKey, 60, 'NX') // Set TTL only if not set
        .exec();

      // Driver compatibility handling (Upstash / ioredis vs redis-node)
      const rawIncrResult = Array.isArray(responses[0]) ? responses[0][1] : responses[0];
      const currentRequests = Number(rawIncrResult) || 1;

      // Calculate reset time in seconds for clients
      const secondsUntilNextMinute = 60 - (Math.floor(Date.now() / 1000) % 60);

      // Add Headers to Response
      res.setHeader('X-RateLimit-Limit', limitPerMinute);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limitPerMinute - currentRequests));
      res.setHeader('X-RateLimit-Reset', secondsUntilNextMinute);

      // Rate limit check
      if (currentRequests > limitPerMinute) {
        res.setHeader('Retry-After', secondsUntilNextMinute);
        return res.status(429).json({
          error: { 
            message: `Rate limit exceeded. Maximum ${limitPerMinute} requests allowed per minute. Please try again in ${secondsUntilNextMinute} seconds.` 
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate Limiter Redis Error:', error);
      next(); // High Availability: Fallback to next middleware on Redis failure
    }
  };
};