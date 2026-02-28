// Mock external modules before importing the controller module
const mockEmit = jest.fn();
jest.mock("../../utils/socketEmitter", () => ({
  getIO: jest.fn(() => ({ emit: mockEmit })),
}));
jest.mock("../../utils/cacheInvalidation", () => ({
  invalidateFeedCache: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../config/redis", () => ({
  redisClient: { isOpen: false },
  safeGet: jest.fn(),
  safeSetEx: jest.fn(),
  safeDel: jest.fn(),
  safeIncr: jest.fn(),
}));
jest.mock("../../connection/database", () => ({
  prisma: {
    threads: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { createThread, getMyThreads } from "../thread";
import {
  createMockRequest,
  createMockResponse,
  createMockFiles,
} from "../../tests/utils";
import { prisma } from "../../connection/database";
import {
  safeGet,
  safeSetEx,
  safeDel,
  safeIncr,
  redisClient,
} from "../../config/redis";
import { getIO } from "../../utils/socketEmitter";

const mockedPrisma = prisma as unknown as {
  threads: {
    create: jest.Mock<any, any>;
    findMany: jest.Mock<any, any>;
    count: jest.Mock<any, any>;
  };
};

const mockedRedis = {
  safeGet: safeGet as jest.Mock,
  safeSetEx: safeSetEx as jest.Mock,
  safeDel: safeDel as jest.Mock,
  safeIncr: safeIncr as jest.Mock,
};

describe("createThread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    const req = createMockRequest({ body: { content: "hello" } });
    const res = createMockResponse();

    await createThread(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("returns 400 when validation fails", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: {},
    }); // missing content
    const res = createMockResponse();

    await createThread(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", code: 400 }),
    );
  });

  it("creates a thread and emits event, invalidates cache", async () => {
    (redisClient as any).isOpen = true;
    (mockedRedis.safeDel as jest.Mock).mockResolvedValue(undefined);
    (mockedRedis.safeIncr as jest.Mock).mockResolvedValue(undefined);

    const created = {
      id: 10,
      content: "A new thread",
      image: ["img1.png"],
      createdBy: { id: 1, username: "alice" },
      createdAt: new Date(),
      _count: { likes: 0, replies: 0 },
    };

    mockedPrisma.threads.create.mockResolvedValue(created);

    const files = createMockFiles(["img1.png"]);

    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: { content: "A new thread" },
      files,
    });
    const res = createMockResponse();

    await createThread(req, res);

    expect(mockedPrisma.threads.create).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith(
      "thread:created",
      expect.objectContaining({ id: 10, content: "A new thread" }),
    );
    expect(mockedRedis.safeDel).toHaveBeenCalledWith("user:1:threads");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", code: 201 }),
    );
  });
});

describe("getMyThreads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns from cache when safeGet returns data", async () => {
    (redisClient as any).isOpen = true;
    const sample = [{ id: 1, content: "cached" }];
    (safeGet as jest.Mock).mockResolvedValue(JSON.stringify(sample));

    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      query: {},
    });
    const res = createMockResponse();

    await getMyThreads(req, res);

    expect(safeGet).toHaveBeenCalledWith("user:1:threads");
    expect(safeIncr).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("cache") }),
    );
  });

  it("fetches from DB when cache miss and sets cache", async () => {
    (redisClient as any).isOpen = true;
    (safeGet as jest.Mock).mockResolvedValue(null);

    const dbThreads = [
      {
        id: 2,
        content: "db thread",
        image: [],
        createdBy: { id: 1, username: "alice" },
        createdAt: new Date(),
        _count: { likes: 1, replies: 0 },
        likes: [{ id: 100, userId: 1 }],
      },
    ];

    mockedPrisma.threads.findMany.mockResolvedValue(dbThreads as any);
    mockedPrisma.threads.count.mockResolvedValue(1);

    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      query: {},
    });
    const res = createMockResponse();

    await getMyThreads(req, res);

    expect(mockedPrisma.threads.findMany).toHaveBeenCalled();
    expect(safeSetEx).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", code: 200 }),
    );
  });
});
