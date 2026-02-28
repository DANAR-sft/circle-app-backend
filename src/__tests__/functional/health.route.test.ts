import request from "supertest";
import app from "../../app";

jest.mock("../../config/redis", () => ({
  redisClient: { isOpen: false },
  safePing: jest.fn(),
}));

describe("GET /api/v1/health (functional)", () => {
  it("returns server ok and redis disconnected when redis closed", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("server", "ok");
    expect(res.body.data).toHaveProperty("redis");
    expect(res.body.data.redis.connected).toBe(false);
  });
});
