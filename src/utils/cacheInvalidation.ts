import { redisClient, safeDel } from "../config/redis";

/**
 * Invalidate feed cache (all pages).
 * Uses Redis SCAN to find and delete all feed:page:* keys.
 */
export async function invalidateFeedCache(): Promise<void> {
  if (!redisClient.isReady) return;

  try {
    // Delete all feed page cache keys
    for await (const key of redisClient.scanIterator({
      MATCH: "feed:page:*",
      COUNT: 100,
    })) {
      await redisClient.del(key);
    }
  } catch (e) {
    console.error("Feed cache invalidation error (best-effort):", e);
  }
}
