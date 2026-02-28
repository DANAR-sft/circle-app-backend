jest.mock("../../config/redis", () => ({
  safeGet: jest.fn(),
  safeSetEx: jest.fn(),
  safeIncr: jest.fn(),
}));

import { Request, Response, NextFunction } from "express";
import { rateLimiter } from "../../middleware/rateLimiter";
import { safeGet, safeSetEx, safeIncr } from "../../config/redis";

const createMockReqResNext = (userId?: number) => {
  const req = {
    user: userId ? { id: userId } : undefined,
    ip: "127.0.0.1",
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
};

describe("rateLimiter middleware", () => {
  const limiter = rateLimiter({
    windowSeconds: 60,
    maxRequests: 3,
    prefix: "test",
  });

  beforeEach(() => jest.clearAllMocks());

  it("allows request and calls next when under limit", async () => {
    (safeGet as jest.Mock).mockResolvedValue("1");

    const { req, res, next } = createMockReqResNext(1);
    await limiter(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 3);
  });

  it("blocks request with 429 when over limit", async () => {
    (safeGet as jest.Mock).mockResolvedValue("3");

    const { req, res, next } = createMockReqResNext(1);
    await limiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets initial key with TTL on first request", async () => {
    (safeGet as jest.Mock).mockResolvedValue(null);

    const { req, res, next } = createMockReqResNext(1);
    await limiter(req, res, next);

    expect(safeSetEx).toHaveBeenCalledWith("ratelimit:test:1", 60, "1");
    expect(next).toHaveBeenCalled();
  });

  it("fails open if Redis is down", async () => {
    (safeGet as jest.Mock).mockRejectedValue(new Error("Redis down"));

    const { req, res, next } = createMockReqResNext(1);
    await limiter(req, res, next);

    expect(next).toHaveBeenCalled(); // should still proceed
  });
});
