import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";

jest.mock("../../connection/database", () => ({
  prisma: {
    threads: {
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
  },
}));

jest.mock("../../config/redis", () => ({
  redisClient: { isOpen: false },
  safeGet: jest.fn(),
  safeSetEx: jest.fn(),
  safeIncr: jest.fn(),
}));

import { prisma } from "../../connection/database";

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

describe("Thread routes (functional)", () => {
  it("GET /api/v1/thread returns 401 when unauthorized", async () => {
    const res = await request(app).get("/api/v1/thread");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/thread/mine returns cached data when token valid", async () => {
    const sample = [
      {
        id: 1,
        content: "db thread",
        image: [],
        createdBy: { id: 1, username: "alice" },
        createdAt: new Date(),
        _count: { likes: 1, replies: 0 },
        likes: [{ id: 100, userId: 1 }],
      },
    ];
    (prisma.threads.findMany as jest.Mock).mockResolvedValue(sample as any);

    const token = jwt.sign({ id: 1, email: "test@example.com" }, JWT_SECRET);

    const res = await request(app)
      .get("/api/v1/thread/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });
});
