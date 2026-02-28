import { Request, Response } from "express";
import { redisClient, safePing } from "../config/redis";

export async function getHealth(req: Request, res: Response) {
  try {
    const redisConnected = redisClient.isReady;
    let redisPing: string | null = null;

    if (redisConnected) {
      try {
        redisPing = await safePing();
      } catch (e) {
        console.error("Redis ping failed:", e);
        redisPing = null;
      }
    }

    return res.status(200).json({
      code: 200,
      status: "ok",
      data: {
        server: "ok",
        redis: {
          connected: redisConnected,
          ping: redisPing,
        },
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res
      .status(500)
      .json({ code: 500, status: "error", message: "Health check failed" });
  }
}
