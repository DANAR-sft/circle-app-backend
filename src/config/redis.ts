import { createClient } from "redis";
import "dotenv/config";

let lastErrorLog = 0;
const ERROR_LOG_INTERVAL = 30000; // Log error setiap 30 detik saja

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    // Reconnect dengan interval lebih lama: mulai 5 detik, max 60 detik
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        // Setelah 20 kali retry, hentikan reconnect
        console.log("Redis: max retries reached, stopping reconnect attempts");
        return false; // Stop reconnecting
      }
      return Math.min(retries * 5000, 60000);
    },
  },
});

// Batasi log error agar tidak spam
redisClient.on("error", (err) => {
  const now = Date.now();
  if (now - lastErrorLog > ERROR_LOG_INTERVAL) {
    console.error("Redis unavailable:", err.code || err.message);
    lastErrorLog = now;
  }
});
redisClient.on("connect", () => console.log("Redis client connecting..."));
redisClient.on("ready", () => console.log("Redis client ready"));

export const connectRedis = async () => {
  if (!redisClient.isReady) {
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  }
};

export const safeGet = async (key: string): Promise<string | null> => {
  if (!redisClient.isReady) return null;
  try {
    return await redisClient.get(key);
  } catch (e) {
    console.error("safeGet error:", e);
    return null;
  }
};

export const safeSetEx = async (key: string, ttl: number, value: string) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.setEx(key, ttl, value);
  } catch (e) {
    console.error("safeSetEx error:", e);
  }
};

export const safeDel = async (key: string) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(key);
  } catch (e) {
    console.error("safeDel error:", e);
  }
};

export const safeIncr = async (key: string) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.incr(key);
  } catch (e) {
    console.error("safeIncr error:", e);
  }
};

export const safePing = async (): Promise<string | null> => {
  if (!redisClient.isReady) return null;
  try {
    return await redisClient.ping();
  } catch (e) {
    console.error("safePing error:", e);
    return null;
  }
};

export { redisClient };
