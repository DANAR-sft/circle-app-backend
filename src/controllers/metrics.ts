import { Request, Response } from "express";
import { redisClient, safeGet } from "../config/redis";

export async function getCacheMetrics(req: Request, res: Response) {
  try {
    const { userId } = req.query;

    const keys = {
      hits: "metrics:cache:myThreads:hits",
      misses: "metrics:cache:myThreads:misses",
      sets: "metrics:cache:myThreads:sets",
      invalidations: "metrics:cache:myThreads:invalidations",
    };

    const result: Record<string, number | Record<string, number>> = {};

    try {
      const [hits, misses, sets, invalidations] = await Promise.all([
        safeGet(keys.hits),
        safeGet(keys.misses),
        safeGet(keys.sets),
        safeGet(keys.invalidations),
      ]);

      result.global = {
        hits: Number(hits || 0),
        misses: Number(misses || 0),
        sets: Number(sets || 0),
        invalidations: Number(invalidations || 0),
      };
    } catch (e) {
      console.error("Redis get error (global metrics):", e);
      result.global = { hits: 0, misses: 0, sets: 0, invalidations: 0 };
    }

    if (userId) {
      try {
        const userKeyBase = `metrics:cache:user:${userId}:myThreads`;
        const [uh, um, us, ui] = await Promise.all([
          safeGet(`${userKeyBase}:hits`),
          safeGet(`${userKeyBase}:misses`),
          safeGet(`${userKeyBase}:sets`),
          safeGet(`metrics:cache:user:${userId}:invalidations`),
        ]);
        result.user = {
          hits: Number(uh || 0),
          misses: Number(um || 0),
          sets: Number(us || 0),
          invalidations: Number(ui || 0),
        };
      } catch (e) {
        console.error("Redis get error (user metrics):", e);
        result.user = { hits: 0, misses: 0, sets: 0, invalidations: 0 };
      }
    }

    return res.status(200).json({ code: 200, status: "success", data: result });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Failed to retrieve metrics",
    });
  }
}
