import { Request, Response, NextFunction } from "express";
import { safeGet, safeSetEx, safeIncr } from "../config/redis";

interface RateLimitOptions {
  /** Time window in seconds */
  windowSeconds: number;
  /** Max requests per window */
  maxRequests: number;
  /** Key prefix for Redis */
  prefix: string;
}

/**
 * Redis-based rate limiter middleware.
 * Falls back to allowing requests if Redis is unavailable (fail-open).
 */
export function rateLimiter(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, prefix } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Identify client by user ID (if authenticated) or IP
      const identifier = req.user?.id?.toString() || req.ip || "unknown";
      const key = `ratelimit:${prefix}:${identifier}`;

      const current = await safeGet(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        return res.status(429).json({
          code: 429,
          status: "error",
          message: `Too many requests. Please try again in ${windowSeconds} seconds.`,
        });
      }

      // Increment counter
      if (count === 0) {
        // First request in window — set key with TTL
        await safeSetEx(key, windowSeconds, "1");
      } else {
        // Subsequent requests — increment
        await safeIncr(key);
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - count - 1),
      );

      next();
    } catch (error) {
      // Fail-open: if Redis is down, allow the request
      console.error("Rate limiter error (fail-open):", error);
      next();
    }
  };
}

// Pre-configured rate limiters
export const authRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 10, // 10 login/register attempts per minute
  prefix: "auth",
});

export const writeRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 30, // 30 write operations per minute
  prefix: "write",
});

export const apiRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  prefix: "api",
});
