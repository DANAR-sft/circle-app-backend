jest.mock("../../utils/socketEmitter", () => ({
  getIO: jest.fn(() => ({ emit: jest.fn() })),
}));
jest.mock("../../connection/database", () => ({
  prisma: {
    likes: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { likeThread, unlikeThread } from "../likeThread";
import { createMockRequest, createMockResponse } from "../../tests/utils";
import { prisma } from "../../connection/database";

const mockedPrisma = prisma as unknown as {
  likes: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

describe("likeThread", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when user is not authenticated", async () => {
    const req = createMockRequest({ body: { threadId: 1 } });
    const res = createMockResponse();

    await likeThread(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("creates a like and returns 201", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: { threadId: "5" },
    });
    const res = createMockResponse();

    mockedPrisma.likes.create.mockResolvedValue({
      id: 10,
      userId: 1,
      threadId: 5,
    });
    mockedPrisma.likes.count.mockResolvedValue(3);

    await likeThread(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockedPrisma.likes.create).toHaveBeenCalled();
  });
});

describe("unlikeThread", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 when like record not found", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      params: { id: "999" },
    });
    const res = createMockResponse();

    mockedPrisma.likes.findUnique.mockResolvedValue(null);

    await unlikeThread(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deletes like and returns 200", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      params: { id: "10" },
    });
    const res = createMockResponse();

    mockedPrisma.likes.findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      threadId: 5,
    });
    mockedPrisma.likes.delete.mockResolvedValue({
      id: 10,
      userId: 1,
      threadId: 5,
    });
    mockedPrisma.likes.count.mockResolvedValue(2);

    await unlikeThread(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedPrisma.likes.delete).toHaveBeenCalled();
  });
});
