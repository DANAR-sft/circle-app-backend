// Mock redis module before importing controller
jest.mock("../../config/redis", () => ({
  redisClient: { isOpen: false },
  safePing: jest.fn(),
}));

import { getHealth } from "../health";
import { safePing, redisClient } from "../../config/redis";
import { createMockRequest, createMockResponse } from "../../tests/utils";

describe("getHealth controller", () => {
  it("returns redis disconnected when redis is not open", async () => {
    (redisClient as any).isOpen = false;
    (safePing as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest();
    const res = createMockResponse();

    await getHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          redis: { connected: false, ping: null },
        }),
      }),
    );
  });

  it("returns redis ping when connected", async () => {
    (redisClient as any).isOpen = true;
    (safePing as jest.Mock).mockResolvedValue("PONG");

    const req = createMockRequest();
    const res = createMockResponse();

    await getHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          redis: { connected: true, ping: "PONG" },
        }),
      }),
    );
  });

  it("handles safePing throwing and returns null ping", async () => {
    (redisClient as any).isOpen = true;
    (safePing as jest.Mock).mockRejectedValue(new Error("boom"));

    const req = createMockRequest();
    const res = createMockResponse();

    await getHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          redis: { connected: true, ping: null },
        }),
      }),
    );
  });
});
