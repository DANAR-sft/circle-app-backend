jest.mock("../../utils/socketEmitter", () => ({
  getIO: jest.fn(() => ({ emit: jest.fn() })),
}));
jest.mock("../../connection/database", () => ({
  prisma: {
    following: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { followUser, unfollowUser, getFollows } from "../follow";
import { createMockRequest, createMockResponse } from "../../tests/utils";
import { prisma } from "../../connection/database";

const mockedPrisma = prisma as unknown as {
  following: {
    findFirst: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

describe("followUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when user is not authenticated", async () => {
    const req = createMockRequest({ body: { id: 2 } });
    const res = createMockResponse();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when trying to follow yourself", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: { id: "1" },
    });
    const res = createMockResponse();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.message).toMatch(/cannot follow yourself/i);
  });

  it("creates a follow and returns 201", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: { id: "2" },
    });
    const res = createMockResponse();

    mockedPrisma.following.findFirst.mockResolvedValue(null); // not already following
    mockedPrisma.following.create.mockResolvedValue({
      id: 5,
      followerId: 1,
      followingId: 2,
      isFollowing: true,
    });
    mockedPrisma.following.count.mockResolvedValue(1);

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockedPrisma.following.create).toHaveBeenCalled();
  });
});

describe("unfollowUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when not following the user", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      body: { id: "2" },
    });
    const res = createMockResponse();

    mockedPrisma.following.findFirst.mockResolvedValue(null);

    await unfollowUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("getFollows", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when user is not authenticated", async () => {
    const req = createMockRequest({ query: { type: "followers" } });
    const res = createMockResponse();

    await getFollows(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns followers with isFollowedBack status (batch query, no N+1)", async () => {
    const req = createMockRequest({
      user: { id: 1, email: "test@example.com" },
      query: { type: "followers" },
    });
    const res = createMockResponse();

    // User 1 has followers: user 2 and user 3
    mockedPrisma.following.findMany
      .mockResolvedValueOnce([
        {
          id: 10,
          followerId: 2,
          followingId: 1,
          follower: { id: 2, username: "user2" },
        },
        {
          id: 11,
          followerId: 3,
          followingId: 1,
          follower: { id: 3, username: "user3" },
        },
      ])
      // Batch query: user 1 follows back user 2 only
      .mockResolvedValueOnce([{ followingId: 2 }]);

    await getFollows(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.data).toHaveLength(2);
    expect(jsonCall.data[0].isFollowedBack).toBe(true); // user 2
    expect(jsonCall.data[1].isFollowedBack).toBe(false); // user 3
  });
});
